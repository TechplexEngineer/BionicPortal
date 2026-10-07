import { describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
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
			locals: { user: { id: "mentor", role: "mentor" }, db },
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
			locals: { user: { id: "mentor", role: "mentor" }, db },
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
