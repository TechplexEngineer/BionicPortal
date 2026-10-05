import { describe, expect, it, vi } from "vitest";
import * as table from "$lib/server/db/schema";
import { actions } from "./+page.server";

function createDb() {
	const values = vi.fn().mockResolvedValue(undefined);
	const insert = vi.fn(() => ({ values }));
	const select = vi.fn(() => ({
		from: vi.fn(() => ({
			where: vi.fn().mockResolvedValue([
				{
					id: "source-form",
					eventId: "source-event",
					name: "Permission Form",
					basePdfKey: "events/source-event/forms/source-form/base.pdf",
					definition: { version: 1, fields: [{ id: "field-1" }] }
				}
			])
		}))
	}));
	return { insert, select, values };
}

function createBucket() {
	return {
		get: vi.fn().mockResolvedValue({ arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)) }),
		put: vi.fn().mockResolvedValue(undefined)
	};
}

function actionInput(db = createDb(), bucket = createBucket()) {
	const formData = new FormData();
	formData.set("sourceFormId", "source-form");
	return {
		request: new Request("http://localhost/admin/events/target-event/forms", {
			method: "POST",
			body: formData
		}),
		locals: { db },
		platform: { env: { FORMS_BUCKET: bucket } },
		params: { id: "target-event" }
	} as unknown as Parameters<NonNullable<typeof actions.copy>>[0];
}

describe("copy event form action", () => {
	it("copies the form definition and PDF without creating submissions", async () => {
		const db = createDb();
		const bucket = createBucket();

		await expect(actions.copy(actionInput(db, bucket))).resolves.toEqual({
			success: true,
			message: "Copied Permission Form."
		});
		expect(bucket.get).toHaveBeenCalledWith("events/source-event/forms/source-form/base.pdf");
		expect(bucket.put).toHaveBeenCalledWith(
			expect.stringMatching(/^events\/target-event\/forms\/[^/]+\/base\.pdf$/),
			expect.any(ArrayBuffer),
			expect.objectContaining({ httpMetadata: { contentType: "application/pdf" } })
		);
		expect(db.insert).toHaveBeenCalledWith(table.eventForms);
		expect(db.insert).not.toHaveBeenCalledWith(table.eventFormSubmissions);
		expect(db.values).toHaveBeenCalledWith(
			expect.objectContaining({
				eventId: "target-event",
				name: "Permission Form",
				definition: { version: 1, fields: [{ id: "field-1" }] }
			})
		);
	});

	it("rejects a missing source form without touching storage", async () => {
		const db = createDb();
		const bucket = createBucket();
		const formData = new FormData();
		const input = actionInput(db, bucket);
		const request = new Request("http://localhost/admin/events/target-event/forms", {
			method: "POST",
			body: formData
		});

		const result = await actions.copy({ ...input, request } as Parameters<
			NonNullable<typeof actions.copy>
		>[0]);

		expect(result).toMatchObject({ status: 400, data: { message: "Choose a form to copy." } });
		expect(bucket.get).not.toHaveBeenCalled();
	});
});
