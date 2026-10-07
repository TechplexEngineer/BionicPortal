import { afterEach, describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import { actions, load } from "./+page.server";

function dbWithSops(sops: unknown[]) {
	const query = {
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockResolvedValue(sops)
	};
	return { db: { select: vi.fn().mockReturnValue(query) }, query };
}

describe("SOP access", () => {
	it("backfills existing SOPs as shared and active while new SOPs default to private", () => {
		const db = new Database(":memory:");
		db.exec(`CREATE TABLE sops (
			id text PRIMARY KEY NOT NULL,
			title text NOT NULL,
			content text NOT NULL,
			created_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
			updated_at integer DEFAULT CURRENT_TIMESTAMP NOT NULL
		)`);
		db.prepare("INSERT INTO sops (id, title, content) VALUES (?, ?, ?)").run(
			"existing",
			"Existing SOP",
			"Content"
		);

		const migration = readFileSync(
			join(process.cwd(), "drizzle/0020_sop_visibility_and_archive.sql"),
			"utf8"
		);
		db.exec(migration);

		expect(db.prepare("SELECT private, archived FROM sops WHERE id = ?").get("existing")).toEqual({
			private: 0,
			archived: 0
		});
		db.prepare("INSERT INTO sops (id, title, content) VALUES (?, ?, ?)").run(
			"new",
			"New SOP",
			"Content"
		);
		expect(db.prepare("SELECT private, archived FROM sops WHERE id = ?").get("new")).toEqual({
			private: 1,
			archived: 0
		});
		db.close();
	});

	it("exposes visibility fields in the Drizzle SOP schema", () => {
		expect(table.sops.private.name).toBe("private");
		expect(table.sops.archived.name).toBe("archived");
	});

	it("returns only shared active SOPs to students", async () => {
		const { db, query } = dbWithSops([]);
		const result = await load({
			locals: {
				user: {
					id: "student",
					role: "user",
					username: "student@example.com"
				},
				db
			},
			url: new URL("http://localhost/sops")
		} as unknown as Parameters<typeof load>[0]);

		expect(result.user.role).toBe("user");
		expect(result.sops).toEqual([]);
		expect(query.where).toHaveBeenCalledWith(
			and(eq(table.sops.private, false), eq(table.sops.archived, false))
		);
	});

	it("returns active SOPs to mentors by default", async () => {
		const { db, query } = dbWithSops([]);
		await load({
			locals: {
				user: {
					id: "mentor",
					role: "mentor",
					username: "mentor@example.com",
					mentorApproved: true
				},
				db
			},
			url: new URL("http://localhost/sops")
		} as unknown as Parameters<typeof load>[0]);
		expect(query.where).toHaveBeenCalledWith(eq(table.sops.archived, false));
	});

	it("includes active and archived SOPs for mentors when archived=1", async () => {
		const { db, query } = dbWithSops([]);
		await load({
			locals: {
				user: {
					id: "mentor",
					role: "mentor",
					username: "mentor@example.com",
					mentorApproved: true
				},
				db
			},
			url: new URL("http://localhost/sops?archived=1")
		} as unknown as Parameters<typeof load>[0]);
		expect(query.where).not.toHaveBeenCalled();
	});

	it("defaults new SOPs to private when the sharing checkbox is absent", async () => {
		const values = vi.fn();
		const db = { insert: vi.fn().mockReturnValue({ values }) };
		await actions.create({
			locals: { user: { id: "mentor", role: "mentor", mentorApproved: true }, db },
			request: new Request("http://localhost/sops", {
				method: "POST",
				body: new URLSearchParams({ title: "New SOP", content: "Instructions" })
			})
		} as unknown as Parameters<NonNullable<typeof actions.create>>[0]);
		expect(values).toHaveBeenCalledWith(
			expect.objectContaining({ title: "New SOP", content: "Instructions", private: true })
		);
	});

	it("defaults an updated SOP to private when the sharing checkbox is absent", async () => {
		const set = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
		const db = { update: vi.fn().mockReturnValue({ set }) };
		await actions.update({
			locals: { user: { id: "admin", role: "admin" }, db },
			request: new Request("http://localhost/sops", {
				method: "POST",
				body: new URLSearchParams({ id: "sop-1", title: "Updated", content: "Instructions" })
			})
		} as unknown as Parameters<NonNullable<typeof actions.update>>[0]);
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Updated", content: "Instructions", private: true })
		);
	});

	it("lets mentors share an updated SOP when the sharing checkbox is checked", async () => {
		const set = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
		const db = { update: vi.fn().mockReturnValue({ set }) };
		await actions.update({
			locals: { user: { id: "mentor", role: "mentor", mentorApproved: true }, db },
			request: new Request("http://localhost/sops", {
				method: "POST",
				body: new URLSearchParams({
					id: "sop-1",
					title: "Updated",
					content: "Instructions",
					shareWithStudents: "on"
				})
			})
		} as unknown as Parameters<NonNullable<typeof actions.update>>[0]);
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Updated", content: "Instructions", private: false })
		);
	});

	it("rejects SOP creation by an unapproved mentor", async () => {
		await expect(
			actions.create({
				locals: { user: { id: "mentor", role: "mentor", mentorApproved: false }, db: {} },
				request: new Request("http://localhost/sops", {
					method: "POST",
					body: new URLSearchParams({ title: "New SOP", content: "Instructions" })
				})
			} as unknown as Parameters<NonNullable<typeof actions.create>>[0])
		).rejects.toMatchObject({ status: 302, location: "/dashboard" });
	});

	it("rejects SOP updates by an unapproved mentor", async () => {
		await expect(
			actions.update({
				locals: { user: { id: "mentor", role: "mentor", mentorApproved: false }, db: {} },
				request: new Request("http://localhost/sops", {
					method: "POST",
					body: new URLSearchParams({
						id: "sop-1",
						title: "Updated",
						content: "Instructions"
					})
				})
			} as unknown as Parameters<NonNullable<typeof actions.update>>[0])
		).rejects.toMatchObject({ status: 302, location: "/dashboard" });
	});

	it("deletes only the SOP identified by the form", async () => {
		const where = vi.fn().mockResolvedValue({ success: true });
		const db = {
			delete: vi.fn().mockReturnValue({ where })
		};

		await actions.delete({
			locals: { user: { id: "admin", role: "admin" }, db },
			request: new Request("http://localhost/sops", {
				method: "POST",
				body: new URLSearchParams({ id: "sop-to-delete" })
			})
		} as unknown as Parameters<NonNullable<typeof actions.delete>>[0]);

		expect(db.delete).toHaveBeenCalledWith(table.sops);
		expect(where).toHaveBeenCalledWith(eq(table.sops.id, "sop-to-delete"));
	});
});

describe("SOP lifecycle actions", () => {
	const databases: Database.Database[] = [];
	afterEach(() => {
		for (const database of databases) database.close();
		databases.length = 0;
	});

	function fixture() {
		const sqlite = new Database(":memory:");
		databases.push(sqlite);
		sqlite.exec(`CREATE TABLE sops (
			id text PRIMARY KEY NOT NULL,
			title text NOT NULL,
			content text NOT NULL,
			private integer NOT NULL DEFAULT 1,
			archived integer NOT NULL DEFAULT 0,
			created_at integer NOT NULL,
			updated_at integer NOT NULL
		)`);
		const insert = sqlite.prepare(`INSERT INTO sops
			(id, title, content, private, archived, created_at, updated_at)
			VALUES (?, ?, 'Instructions', ?, ?, 1, 1)`);
		insert.run("shared", "Shared", 0, 0);
		insert.run("private", "Private", 1, 0);
		insert.run("archived", "Archived", 0, 1);
		return { sqlite, db: drizzle(sqlite, { schema: table }) };
	}

	function event(
		db: ReturnType<typeof fixture>["db"],
		role: string,
		fields: Record<string, string>,
		mentorApproved = true
	) {
		return {
			locals: { user: { id: role, role, mentorApproved }, db },
			request: new Request("http://localhost/sops", {
				method: "POST",
				body: new URLSearchParams(fields)
			})
		} as unknown as Parameters<NonNullable<typeof actions.archive>>[0];
	}

	function state(sqlite: Database.Database, id: string) {
		return sqlite.prepare("SELECT private, archived FROM sops WHERE id = ?").get(id);
	}

	function changeBeforeUpdate(
		db: ReturnType<typeof fixture>["db"],
		sqlite: Database.Database,
		statement: string
	) {
		return new Proxy(db, {
			get(target, property, receiver) {
				if (property === "update") {
					return (sopTable: typeof table.sops) => {
						sqlite.exec(statement);
						return target.update(sopTable);
					};
				}
				return Reflect.get(target, property, receiver);
			}
		});
	}

	it("lets an approved mentor create and update a shared SOP", async () => {
		const { sqlite, db } = fixture();
		const created = await actions.create(
			event(db, "mentor", {
				title: "Mentor SOP",
				content: "First version",
				shareWithStudents: "on"
			})
		);
		expect(created).toMatchObject({ success: "SOP created.", id: expect.any(String) });
		const id = (created as { id: string }).id;
		expect(state(sqlite, id)).toEqual({ private: 0, archived: 0 });

		const updated = await actions.update(
			event(db, "mentor", {
				id,
				title: "Revised SOP",
				content: "Second version"
			})
		);
		expect(updated).toMatchObject({ success: "SOP saved.", id });
		expect(sqlite.prepare("SELECT title, content, private FROM sops WHERE id = ?").get(id)).toEqual(
			{
				title: "Revised SOP",
				content: "Second version",
				private: 1
			}
		);
	});

	it.each(["admin", "mentor"])(
		"lets an approved %s archive only the requested active SOP",
		async (role) => {
			const { sqlite, db } = fixture();
			const result = await actions.archive(event(db, role, { id: "private" }));
			expect(result).toMatchObject({ success: expect.any(String), id: "private" });
			expect(state(sqlite, "private")).toEqual({ private: 1, archived: 1 });
			expect(state(sqlite, "shared")).toEqual({ private: 0, archived: 0 });
		}
	);

	it("lets a student archive a shared active SOP globally", async () => {
		const { sqlite, db } = fixture();
		const result = await actions.archive(event(db, "user", { id: "shared" }));
		expect(result).toMatchObject({ success: expect.any(String), id: "shared" });
		expect(state(sqlite, "shared")).toEqual({ private: 0, archived: 1 });
		expect(state(sqlite, "private")).toEqual({ private: 1, archived: 0 });
	});

	it.each(["private", "archived", "missing"])(
		"rejects a student's archive of %s SOPs",
		async (id) => {
			const { sqlite, db } = fixture();
			const result = await actions.archive(event(db, "user", { id }));
			expect(result).toMatchObject({ status: 400 });
			expect(state(sqlite, "shared")).toEqual({ private: 0, archived: 0 });
			expect(state(sqlite, "private")).toEqual({ private: 1, archived: 0 });
			expect(state(sqlite, "archived")).toEqual({ private: 0, archived: 1 });
		}
	);

	it("rejects archiving an SOP that is already archived", async () => {
		const { sqlite, db } = fixture();
		const result = await actions.archive(event(db, "admin", { id: "archived" }));
		expect(result).toMatchObject({ status: 400 });
		expect(state(sqlite, "archived")).toEqual({ private: 0, archived: 1 });
	});

	it("rejects a student's archive if sharing is revoked after the read", async () => {
		const { sqlite, db } = fixture();
		const concurrentDb = changeBeforeUpdate(
			db,
			sqlite,
			"UPDATE sops SET private = 1 WHERE id = 'shared'"
		);
		const result = await actions.archive(event(concurrentDb, "user", { id: "shared" }));
		expect(result).toMatchObject({ status: 400 });
		expect(state(sqlite, "shared")).toEqual({ private: 1, archived: 0 });
	});

	it("rejects an archive if another request archives it after the read", async () => {
		const { sqlite, db } = fixture();
		const concurrentDb = changeBeforeUpdate(
			db,
			sqlite,
			"UPDATE sops SET archived = 1 WHERE id = 'shared'"
		);
		const result = await actions.archive(event(concurrentDb, "admin", { id: "shared" }));
		expect(result).toMatchObject({ status: 400 });
		expect(state(sqlite, "shared")).toEqual({ private: 0, archived: 1 });
	});

	it.each(["admin", "mentor"])(
		"lets an approved %s restore only the requested archived SOP",
		async (role) => {
			const { sqlite, db } = fixture();
			const result = await actions.restore(event(db, role, { id: "archived" }));
			expect(result).toMatchObject({ success: expect.any(String), id: "archived" });
			expect(state(sqlite, "archived")).toEqual({ private: 0, archived: 0 });
			expect(state(sqlite, "private")).toEqual({ private: 1, archived: 0 });
		}
	);

	it.each(["shared", "missing"])("rejects restoring a %s SOP", async (id) => {
		const { sqlite, db } = fixture();
		const result = await actions.restore(event(db, "admin", { id }));
		expect(result).toMatchObject({ status: 400 });
		expect(state(sqlite, "shared")).toEqual({ private: 0, archived: 0 });
	});

	it("rejects a restore if another request restores it after the read", async () => {
		const { sqlite, db } = fixture();
		const concurrentDb = changeBeforeUpdate(
			db,
			sqlite,
			"UPDATE sops SET archived = 0 WHERE id = 'archived'"
		);
		const result = await actions.restore(event(concurrentDb, "mentor", { id: "archived" }));
		expect(result).toMatchObject({ status: 400 });
		expect(state(sqlite, "archived")).toEqual({ private: 0, archived: 0 });
	});

	it.each(["archive", "restore"])("rejects a missing id for %s", async (action) => {
		const { sqlite, db } = fixture();
		const result = await actions[action](event(db, "admin", {}));
		expect(result).toMatchObject({ status: 400 });
		expect(state(sqlite, "shared")).toEqual({ private: 0, archived: 0 });
	});

	it("does not let a student restore or permanently delete an SOP", async () => {
		const { sqlite, db } = fixture();
		await expect(actions.restore(event(db, "user", { id: "archived" }))).rejects.toMatchObject({
			status: 302
		});
		await expect(actions.delete(event(db, "user", { id: "shared" }))).rejects.toMatchObject({
			status: 302
		});
		expect(state(sqlite, "archived")).toEqual({ private: 0, archived: 1 });
		expect(state(sqlite, "shared")).toEqual({ private: 0, archived: 0 });
	});

	it("does not let a mentor permanently delete an SOP", async () => {
		const { sqlite, db } = fixture();
		await expect(actions.delete(event(db, "mentor", { id: "shared" }))).rejects.toMatchObject({
			status: 302
		});
		expect(state(sqlite, "shared")).toEqual({ private: 0, archived: 0 });
	});

	it("keeps permanent deletion available to admins and targets only the requested SOP", async () => {
		const { sqlite, db } = fixture();
		const result = await actions.delete(event(db, "admin", { id: "shared" }));
		expect(result).toMatchObject({ success: expect.any(String) });
		expect(state(sqlite, "shared")).toBeUndefined();
		expect(state(sqlite, "private")).toEqual({ private: 1, archived: 0 });
	});

	it.each(["archive", "restore"])("blocks unapproved mentor %s submissions", async (action) => {
		const { sqlite, db } = fixture();
		await expect(
			actions[action](event(db, "mentor", { id: "archived" }, false))
		).rejects.toMatchObject({ status: 302 });
		expect(state(sqlite, "archived")).toEqual({ private: 0, archived: 1 });
	});

	it("requires an explicit mentor approval on archive", async () => {
		const { sqlite, db } = fixture();
		const submission = event(db, "mentor", { id: "shared" });
		delete (submission.locals.user as { mentorApproved?: boolean }).mentorApproved;
		await expect(actions.archive(submission)).rejects.toMatchObject({ status: 302 });
		expect(state(sqlite, "shared")).toEqual({ private: 0, archived: 0 });
	});
});
