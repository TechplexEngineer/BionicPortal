import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { actions as formActions } from "./+page.server";
import { actions as editActions } from "./[formId]/edit/+page.server";

const databases: Database.Database[] = [];
afterEach(() => {
	for (const database of databases) database.close();
	databases.length = 0;
});

function setup() {
	const sqlite = new Database(":memory:");
	databases.push(sqlite);
	sqlite.pragma("foreign_keys = ON");
	sqlite.exec(`
		CREATE TABLE students (userid TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, parent_names TEXT, parent_emails TEXT, phone TEXT, parent_phone TEXT, dietary_restrictions TEXT, intolerance_level TEXT, graduation_year TEXT, tshirt_size TEXT, custom_fields TEXT, current_grade TEXT, gender TEXT, date_of_birth TEXT, hidden INTEGER NOT NULL DEFAULT 0);
		CREATE TABLE standalone_forms (id TEXT PRIMARY KEY, name TEXT NOT NULL, base_pdf_key TEXT NOT NULL, definition TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft');
		CREATE TABLE standalone_form_assignments (id TEXT PRIMARY KEY, form_id TEXT NOT NULL REFERENCES standalone_forms(id) ON DELETE CASCADE, student_id TEXT NOT NULL REFERENCES students(userid) ON DELETE CASCADE, student_values TEXT NOT NULL DEFAULT '{}', parent_values TEXT NOT NULL DEFAULT '{}', student_submitted_at INTEGER, parent_required INTEGER, parent_completed_at INTEGER, signed_pdf_key TEXT, UNIQUE(form_id, student_id));
	`);
	sqlite
		.prepare("INSERT INTO students (userid, first_name, last_name) VALUES (?, ?, ?)")
		.run("student@example.com", "Student", "One");
	sqlite
		.prepare("INSERT INTO standalone_forms VALUES (?, ?, ?, ?, ?)")
		.run(
			"form-1",
			"Consent",
			"standalone-forms/form-1/base.pdf",
			JSON.stringify({ version: 1, fields: [] }),
			"draft"
		);
	const bucket = { delete: vi.fn().mockResolvedValue(undefined) };
	return { sqlite, db: drizzle(sqlite), bucket };
}

function input(state: ReturnType<typeof setup>, fields: Record<string, string>, role = "admin") {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) body.set(key, value);
	return {
		request: new Request("http://localhost/admin/forms", { method: "POST", body }),
		params: { formId: "form-1" },
		locals: { db: state.db, user: { role } },
		platform: { env: { FORMS_BUCKET: state.bucket } }
	} as unknown as Parameters<typeof formActions.toggleStatus>[0];
}

function editInput(state: ReturnType<typeof setup>, name: string, definition: object) {
	return input(state, { name, definition: JSON.stringify(definition) }) as unknown as Parameters<
		typeof editActions.save
	>[0];
}

describe("standalone form administration", () => {
	it("assigns a form to every visible student once", async () => {
		const state = setup();
		await formActions.toggleStatus(input(state, { formId: "form-1", status: "assigned" }));
		await formActions.toggleStatus(input(state, { formId: "form-1", status: "assigned" }));
		expect(state.sqlite.prepare("SELECT status FROM standalone_forms").get()).toEqual({
			status: "assigned"
		});
		expect(
			state.sqlite.prepare("SELECT COUNT(*) AS count FROM standalone_form_assignments").get()
		).toEqual({ count: 1 });
		await formActions.toggleStatus(input(state, { formId: "form-1", status: "draft" }));
		expect(state.sqlite.prepare("SELECT status FROM standalone_forms").get()).toEqual({
			status: "draft"
		});
	});

	it("preserves assigned forms during deletion", async () => {
		const state = setup();
		await formActions.toggleStatus(input(state, { formId: "form-1", status: "assigned" }));
		const deleted = await formActions.delete(
			input(state, { formId: "form-1" }) as unknown as Parameters<typeof formActions.delete>[0]
		);
		expect(deleted).toMatchObject({ status: 409 });
		expect(
			state.sqlite.prepare("SELECT id FROM standalone_forms WHERE id = ?").get("form-1")
		).toEqual({ id: "form-1" });
	});

	it("rejects non-admin status changes", async () => {
		const state = setup();
		const result = await formActions.toggleStatus(
			input(state, { formId: "form-1", status: "assigned" }, "user")
		);
		expect(result).toMatchObject({ status: 403 });
	});

	it("locks the field definition after assignment while allowing a rename", async () => {
		const state = setup();
		await formActions.toggleStatus(input(state, { formId: "form-1", status: "assigned" }));
		const changed = {
			version: 1,
			fields: [
				{
					id: "field-1",
					name: "consent",
					type: "text",
					page: 1,
					rect: { x: 0, y: 0, width: 0.5, height: 0.1 },
					required: true
				}
			]
		};
		expect(await editActions.save(editInput(state, "Updated", changed))).toMatchObject({
			status: 409
		});
		await expect(
			editActions.save(editInput(state, "Renamed", { version: 1, fields: [] }))
		).rejects.toMatchObject({ status: 303 });
		expect(state.sqlite.prepare("SELECT name FROM standalone_forms").get()).toEqual({
			name: "Renamed"
		});
	});
});
