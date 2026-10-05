import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { actions, load } from "./[formId]/edit/+page.server";

const pageMarkup = readFileSync(resolve(import.meta.dirname, "[formId]/edit/+page.svelte"), "utf8");

function createDb(
	form: {
		id: string;
		eventId: string;
		name: string;
		basePdfKey: string;
		definition: unknown;
	} = {
		id: "form-1",
		eventId: "event-1",
		name: "Permission Form",
		basePdfKey: "events/event-1/forms/form-1/base.pdf",
		definition: { version: 1, fields: [] }
	}
) {
	const update = vi.fn(() => ({
		set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }))
	}));
	const select = vi.fn(() => ({
		from: vi.fn(() => ({
			where: vi.fn().mockResolvedValue([form])
		}))
	}));
	return { update, select };
}

function actionInput(formData: FormData, db = createDb(), platform?: App.Platform) {
	return {
		request: new Request("http://localhost/admin/events/event-1/forms/form-1/edit", {
			method: "POST",
			body: formData
		}),
		locals: { db },
		platform,
		params: { id: "event-1", formId: "form-1" }
	} as unknown as Parameters<typeof actions.default>[0];
}

describe("event form editor server", () => {
	it("loads the event and relationship-scoped form", async () => {
		const db = createDb();
		const result = await load({
			locals: { db },
			params: { id: "event-1", formId: "form-1" }
		} as unknown as Parameters<typeof load>[0]);

		expect(result).toMatchObject({
			form: {
				id: "form-1",
				name: "Permission Form",
				definition: { version: 1, fields: [] }
			}
		});
	});

	it("updates only name and definition before redirecting to the forms list", async () => {
		const db = createDb();
		const formData = new FormData();
		formData.set("name", " Updated Form ");
		formData.set("definition", JSON.stringify({ version: 1, fields: [] }));

		await expect(actions.save(actionInput(formData, db))).rejects.toMatchObject({
			status: 303,
			location: "/admin/events/event-1/forms"
		});
		const updateQuery = db.update.mock.results[0]?.value as { set: ReturnType<typeof vi.fn> };
		expect(updateQuery.set).toHaveBeenCalledWith({
			name: "Updated Form",
			definition: { version: 1, fields: [] }
		});
	});

	it("allows saving without replacing the PDF when the file input is empty", async () => {
		const db = createDb();
		const formData = new FormData();
		formData.set("name", "Permission Form");
		formData.set("definition", JSON.stringify({ version: 1, fields: [] }));
		formData.set("pdf", new File([], "empty.pdf", { type: "application/pdf" }));

		await expect(actions.save(actionInput(formData, db))).rejects.toMatchObject({ status: 303 });
		expect(db.update).toHaveBeenCalled();
	});

	it("rejects a parseable but invalid definition without writing", async () => {
		const db = createDb();
		const formData = new FormData();
		formData.set("name", "Permission Form");
		formData.set("definition", JSON.stringify({}));

		await expect(actions.save(actionInput(formData, db))).resolves.toMatchObject({
			status: 400,
			data: { message: "The form definition is invalid." }
		});
		expect(db.update).not.toHaveBeenCalled();
	});

	it("replaces the PDF at the existing key without changing the saved fields", async () => {
		const definition = {
			version: 1,
			fields: [
				{
					id: "field-1",
					name: "student_name",
					type: "text",
					page: 1,
					rect: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
					required: true
				}
			]
		};
		const db = createDb({
			id: "form-1",
			eventId: "event-1",
			name: "Permission Form",
			basePdfKey: "events/event-1/forms/form-1/base.pdf",
			definition
		});
		const put = vi.fn().mockResolvedValue(undefined);
		const formData = new FormData();
		formData.set("name", "Permission Form");
		formData.set("definition", JSON.stringify(definition));
		formData.set("pdf", new File(["replacement"], "replacement.pdf", { type: "application/pdf" }));

		await expect(
			actions.save(
				actionInput(formData, db, { env: { FORMS_BUCKET: { put } } } as unknown as App.Platform)
			)
		).rejects.toMatchObject({ status: 303 });
		expect(put).toHaveBeenCalledWith(
			"events/event-1/forms/form-1/base.pdf",
			expect.any(ArrayBuffer),
			expect.objectContaining({ httpMetadata: { contentType: "application/pdf" } })
		);
		const updateQuery = db.update.mock.results[0]?.value as { set: ReturnType<typeof vi.fn> };
		expect(updateQuery.set).toHaveBeenCalledWith({ name: "Permission Form", definition });
	});
});

describe("event form editor page", () => {
	it("renders the stored form and full-width designer against the local base endpoint", () => {
		expect(pageMarkup).toContain(
			'import { PdfFormDesigner, type FormDefinition } from "@team4909/bionic-sign"'
		);
		expect(pageMarkup).toContain(
			'source="/admin/events/{data.event.id}/forms/{data.form.id}/base"'
		);
		expect(pageMarkup).toContain("data.form.definition as FormDefinition");
		expect(pageMarkup).toContain('class="w-100"');
		expect(pageMarkup).toContain('name="definition"');
		expect(pageMarkup).toContain('name="name"');
		expect(pageMarkup).toContain('name="pdf"');
		expect(pageMarkup).toContain('enctype="multipart/form-data"');
		expect(pageMarkup).toContain("keeps the existing fields and form responses");
		expect(pageMarkup).toContain('action="?/save"');
	});
});
