import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";

const databases: Database.Database[] = [];

afterEach(() => {
	for (const database of databases) database.close();
	databases.length = 0;
});

function setup(permissionFormUrl?: string) {
	const sqlite = new Database(":memory:");
	databases.push(sqlite);
	sqlite.pragma("foreign_keys = ON");
	sqlite.exec(`
		CREATE TABLE events (id TEXT PRIMARY KEY, data TEXT NOT NULL);
		CREATE TABLE event_forms (id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), name TEXT NOT NULL, base_pdf_key TEXT NOT NULL, definition TEXT NOT NULL);
		CREATE TABLE event_form_submissions (id TEXT PRIMARY KEY, event_form_id TEXT NOT NULL REFERENCES event_forms(id));
		CREATE TABLE event_registrations (id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), form_completed INTEGER NOT NULL);
	`);
	const eventData = JSON.stringify({ name: "Fall event", permissionFormUrl });
	sqlite.prepare("INSERT INTO events VALUES (?, ?)").run("event-1", eventData);
	sqlite.prepare("INSERT INTO events VALUES (?, ?)").run("event-2", eventData);
	sqlite
		.prepare("INSERT INTO event_forms VALUES (?, ?, ?, ?, ?)")
		.run("form-1", "event-1", "Permission form", "events/event-1/forms/form-1/base.pdf", "{}");
	sqlite.prepare("INSERT INTO event_registrations VALUES (?, ?, ?)").run("reg-1", "event-1", 0);
	const bucket = { delete: vi.fn().mockResolvedValue(undefined) };
	return { sqlite, db: drizzle(sqlite), bucket };
}

function requestFor(formId: string, setupResult: ReturnType<typeof setup>) {
	const formData = new FormData();
	formData.set("formId", formId);
	return {
		request: new Request("http://localhost/admin/events/event-1/forms", {
			method: "POST",
			body: formData
		}),
		params: { id: "event-1" },
		locals: { db: setupResult.db, user: { role: "admin" } },
		platform: { env: { FORMS_BUCKET: setupResult.bucket } }
	} as unknown as Parameters<typeof actions.delete>[0];
}

describe("event form deletion", () => {
	it("rejects a non-admin action request", async () => {
		const state = setup();
		const input = requestFor("form-1", state);
		(input.locals as unknown as { user: { role: string } }).user = { role: "mentor" };
		const response = await actions.delete(input);
		expect(response).toMatchObject({ status: 403 });
		expect(state.sqlite.prepare("SELECT id FROM event_forms WHERE id = 'form-1'").get()).toEqual({
			id: "form-1"
		});
	});

	it("rejects a missing form ID", async () => {
		const state = setup();
		const response = await actions.delete(requestFor("", state));
		expect(response).toMatchObject({ status: 400 });
		expect(state.sqlite.prepare("SELECT COUNT(*) AS count FROM event_forms").get()).toEqual({
			count: 1
		});
		expect(state.bucket.delete).not.toHaveBeenCalled();
	});

	it("does not delete a form belonging to another event", async () => {
		const state = setup();
		state.sqlite
			.prepare("INSERT INTO event_forms VALUES (?, ?, ?, ?, ?)")
			.run("form-2", "event-2", "Other form", "events/event-2/forms/form-2/base.pdf", "{}");
		const response = await actions.delete(requestFor("form-2", state));
		expect(response).toMatchObject({ status: 404 });
		expect(state.sqlite.prepare("SELECT id FROM event_forms WHERE id = 'form-2'").get()).toEqual({
			id: "form-2"
		});
		expect(state.bucket.delete).not.toHaveBeenCalled();
	});

	it("preserves a form that has a submission", async () => {
		const state = setup();
		state.sqlite
			.prepare("INSERT INTO event_form_submissions VALUES (?, ?)")
			.run("submission-1", "form-1");
		const response = await actions.delete(requestFor("form-1", state));
		expect(response).toMatchObject({ status: 409 });
		expect(state.sqlite.prepare("SELECT id FROM event_forms WHERE id = 'form-1'").get()).toEqual({
			id: "form-1"
		});
		expect(state.bucket.delete).not.toHaveBeenCalled();
	});

	it("preserves a form when PDF storage is unavailable", async () => {
		const state = setup();
		const input = requestFor("form-1", state);
		(input.platform as unknown as { env: { FORMS_BUCKET?: unknown } }).env.FORMS_BUCKET = undefined;
		const response = await actions.delete(input);
		expect(response).toMatchObject({ status: 503 });
		expect(state.sqlite.prepare("SELECT id FROM event_forms WHERE id = 'form-1'").get()).toEqual({
			id: "form-1"
		});
	});

	it("deletes an unused form and its PDF without changing manual registration status", async () => {
		const state = setup();
		const response = await actions.delete(requestFor("form-1", state));
		expect(response).toMatchObject({ success: true, message: expect.stringContaining("Review") });
		expect(state.sqlite.prepare("SELECT COUNT(*) AS count FROM event_forms").get()).toEqual({
			count: 0
		});
		expect(state.bucket.delete).toHaveBeenCalledWith("events/event-1/forms/form-1/base.pdf");
		expect(
			state.sqlite
				.prepare("SELECT form_completed FROM event_registrations WHERE id = 'reg-1'")
				.get()
		).toEqual({ form_completed: 0 });
	});

	it("keeps pending status when a legacy permission URL remains", async () => {
		const state = setup("https://example.com/permission");
		const response = await actions.delete(requestFor("form-1", state));
		expect(response).toMatchObject({ success: true });
		expect(
			state.sqlite
				.prepare("SELECT form_completed FROM event_registrations WHERE id = 'reg-1'")
				.get()
		).toEqual({ form_completed: 0 });
	});

	it("keeps pending status while another form remains", async () => {
		const state = setup();
		state.sqlite
			.prepare("INSERT INTO event_forms VALUES (?, ?, ?, ?, ?)")
			.run("form-2", "event-1", "Other form", "events/event-1/forms/form-2/base.pdf", "{}");
		const response = await actions.delete(requestFor("form-1", state));
		expect(response).toMatchObject({ success: true, message: "Form deleted." });
		expect(
			state.sqlite
				.prepare("SELECT form_completed FROM event_registrations WHERE id = 'reg-1'")
				.get()
		).toEqual({ form_completed: 0 });
	});

	it("warns and logs the key when PDF cleanup fails after deletion", async () => {
		const state = setup();
		state.bucket.delete.mockRejectedValueOnce(new Error("R2 unavailable"));
		const log = vi.spyOn(console, "error").mockImplementation(() => {});
		try {
			const response = await actions.delete(requestFor("form-1", state));
			expect(response).toMatchObject({ success: true, warning: true });
			expect(state.sqlite.prepare("SELECT COUNT(*) AS count FROM event_forms").get()).toEqual({
				count: 0
			});
			expect(log).toHaveBeenCalledWith(
				"Failed to remove event form PDF:",
				"events/event-1/forms/form-1/base.pdf",
				expect.any(Error)
			);
		} finally {
			log.mockRestore();
		}
	});
});
