import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { actions as formActions } from "./+page.server";
import { actions as editActions } from "./[formId]/edit/+page.server";
import {
	actions as assignmentActions,
	load as loadAssignments
} from "./[formId]/assignments/+page.server";

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
		CREATE TABLE standalone_forms (id TEXT PRIMARY KEY, name TEXT NOT NULL, base_pdf_key TEXT NOT NULL, definition TEXT NOT NULL);
		CREATE TABLE standalone_form_assignments (id TEXT PRIMARY KEY, form_id TEXT NOT NULL REFERENCES standalone_forms(id) ON DELETE CASCADE, student_id TEXT NOT NULL REFERENCES students(userid) ON DELETE CASCADE, student_values TEXT NOT NULL DEFAULT '{}', parent_values TEXT NOT NULL DEFAULT '{}', student_submitted_at INTEGER, parent_required INTEGER, parent_completed_at INTEGER, signed_pdf_key TEXT, UNIQUE(form_id, student_id));
	`);
	sqlite
		.prepare("INSERT INTO students (userid, first_name, last_name) VALUES (?, ?, ?)")
		.run("student@example.com", "Student", "One");
	sqlite
		.prepare("INSERT INTO standalone_forms VALUES (?, ?, ?, ?)")
		.run(
			"form-1",
			"Consent",
			"standalone-forms/form-1/base.pdf",
			JSON.stringify({ version: 1, fields: [] })
		);
	const bucket = { delete: vi.fn().mockResolvedValue(undefined) };
	return { sqlite, db: drizzle(sqlite), bucket };
}

function input(state: ReturnType<typeof setup>, fields: Record<string, string>, role = "admin") {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) body.set(key, value);
	return {
		request: new Request("http://localhost/admin/forms/form-1/assignments", {
			method: "POST",
			body
		}),
		params: { formId: "form-1" },
		locals: { db: state.db, user: { role } },
		platform: { env: { FORMS_BUCKET: state.bucket } }
	} as unknown as Parameters<typeof assignmentActions.assign>[0];
}

function editInput(state: ReturnType<typeof setup>, name: string, definition: object) {
	return input(state, { name, definition: JSON.stringify(definition) }) as unknown as Parameters<
		typeof editActions.save
	>[0];
}

describe("standalone form administration", () => {
	it("assigns a student once and shows the work as incomplete", async () => {
		const state = setup();
		const request = input(state, { studentId: "student@example.com" });
		await assignmentActions.assign(request);
		await assignmentActions.assign(input(state, { studentId: "student@example.com" }));
		const page = await loadAssignments({
			locals: request.locals,
			params: request.params
		} as Parameters<typeof loadAssignments>[0]);
		expect(page).toMatchObject({
			assignments: [{ studentId: "student@example.com", status: "student-incomplete" }]
		});
		expect(
			state.sqlite.prepare("SELECT COUNT(*) AS count FROM standalone_form_assignments").get()
		).toEqual({ count: 1 });
	});

	it("preserves assigned forms and signed work during deletion", async () => {
		const state = setup();
		await assignmentActions.assign(input(state, { studentId: "student@example.com" }));
		const assignment = state.sqlite.prepare("SELECT id FROM standalone_form_assignments").get() as {
			id: string;
		};
		state.sqlite
			.prepare("UPDATE standalone_form_assignments SET student_submitted_at = ? WHERE id = ?")
			.run(1760000000, assignment.id);
		const unassign = await assignmentActions.unassign(
			input(state, { assignmentId: assignment.id })
		);
		expect(unassign).toMatchObject({ status: 409 });
		const deleted = await formActions.delete(
			input(state, { formId: "form-1" }) as unknown as Parameters<typeof formActions.delete>[0]
		);
		expect(deleted).toMatchObject({ status: 409 });
		expect(
			state.sqlite.prepare("SELECT id FROM standalone_forms WHERE id = ?").get("form-1")
		).toEqual({ id: "form-1" });
		expect(state.bucket.delete).not.toHaveBeenCalled();
	});

	it("rejects non-admin assignment requests", async () => {
		const state = setup();
		const result = await assignmentActions.assign(
			input(state, { studentId: "student@example.com" }, "user")
		);
		expect(result).toMatchObject({ status: 403 });
		expect(
			state.sqlite.prepare("SELECT COUNT(*) AS count FROM standalone_form_assignments").get()
		).toEqual({ count: 0 });
	});

	it("locks the field definition after assignment while allowing a rename", async () => {
		const state = setup();
		await assignmentActions.assign(input(state, { studentId: "student@example.com" }));
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
		const rejected = await editActions.save(editInput(state, "Updated", changed));
		expect(rejected).toMatchObject({ status: 409 });
		expect(state.sqlite.prepare("SELECT name, definition FROM standalone_forms WHERE id = ?").get("form-1")).toEqual({
			name: "Consent",
			definition: JSON.stringify({ version: 1, fields: [] })
		});
		await expect(editActions.save(editInput(state, "Renamed", { version: 1, fields: [] }))).rejects.toMatchObject({ status: 303 });
		expect(state.sqlite.prepare("SELECT name FROM standalone_forms WHERE id = ?").get("form-1")).toEqual({ name: "Renamed" });
	});
});
