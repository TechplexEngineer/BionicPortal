import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function input(
	values: object,
	studentValues: object = {},
	parentRequired = false,
	noFields = false,
	upload?: File
) {
	const assignment = {
		id: "assignment-1",
		studentId: "student@example.com",
		studentValues,
		parentValues: {},
		studentSubmittedAt: null,
		parentCompletedAt: null,
		parentRequired: null
	};
	const form = {
		id: "form-1",
		name: "Agreement",
		basePdfKey: "forms/form-1/base.pdf",
		definition: {
			version: 1,
			fields: [
				{
					id: "field-1",
					name: "student_name",
					type: "text",
					required: true,
					page: 1,
					rect: { x: 0, y: 0, width: 0.5, height: 0.1 }
				},
				...(parentRequired
					? [
							{
								id: "field-2",
								name: "parent_signature",
								type: "signature",
								required: true,
								page: 1,
								rect: { x: 0, y: 0.2, width: 0.5, height: 0.1 }
							}
						]
					: [])
			]
		}
	};
	if (noFields) form.definition.fields = [];
	const student = { userid: "student@example.com", dateOfBirth: "2012-01-01" };
	const where = vi.fn().mockResolvedValue([{ assignment, form, student }]);
	const db = {
		select: vi.fn(() => ({
			from: vi.fn(() => ({ innerJoin: vi.fn(() => ({ innerJoin: vi.fn(() => ({ where })) })) }))
		})),
		update: vi.fn()
	};
	const body = new FormData();
	body.set("values", JSON.stringify(values));
	if (upload) body.set("upload", upload);
	return {
		request: new Request("http://localhost/dashboard/standalone-forms/assignment-1", {
			method: "POST",
			body
		}),
		locals: { db, user: { username: "student@example.com" } },
		params: { assignmentId: "assignment-1" },
		platform: { env: { FORMS_BUCKET: { get: vi.fn(), put: vi.fn() } } }
	} as unknown as Parameters<typeof actions.submit>[0];
}

describe("standalone student form", () => {
	it("allows an incomplete draft but refuses to submit it", async () => {
		const draftInput = input({});
		const draftDb = draftInput.locals.db as unknown as { update: ReturnType<typeof vi.fn> };
		draftDb.update.mockReturnValue({
			set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }))
		});
		expect(await actions.saveDraft(draftInput)).toMatchObject({ success: true });
		const submitInput = input({});
		const result = await actions.submit(submitInput);
		expect(result).toMatchObject({ status: 400 });
		const submitDb = submitInput.locals.db as unknown as { update: ReturnType<typeof vi.fn> };
		expect(submitDb.update).not.toHaveBeenCalled();
	});

	it("records a minor's student submission without a final PDF while parent fields remain", async () => {
		const event = input({ student_name: { type: "text", value: "Alex" } }, {}, true);
		const db = event.locals.db as unknown as { update: ReturnType<typeof vi.fn> };
		const set = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
		db.update.mockReturnValue({ set });
		const result = await actions.submit(event);
		expect(result).toMatchObject({ success: true });
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({ studentSubmittedAt: expect.any(Date), signedPdfKey: null })
		);
		const bucket = event.platform?.env.FORMS_BUCKET as unknown as { put: ReturnType<typeof vi.fn> };
		expect(bucket.put).not.toHaveBeenCalled();
	});

	it("submits a form with no fields and stores its final PDF", async () => {
		const event = input({}, {}, false, true);
		const db = event.locals.db as unknown as { update: ReturnType<typeof vi.fn> };
		const set = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
		db.update.mockReturnValue({ set });
		const bucket = event.platform?.env.FORMS_BUCKET as unknown as {
			get: ReturnType<typeof vi.fn>;
			put: ReturnType<typeof vi.fn>;
		};
		const pdf = readFileSync(
			resolve("vendor/bionic-sign/dist/template/fixtures/permission-form.pdf")
		);
		bucket.get.mockResolvedValue({
			arrayBuffer: async () => pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength)
		});
		bucket.put.mockResolvedValue(undefined);
		const result = await actions.submit(event);
		expect(result).toMatchObject({ success: true });
		expect(bucket.put).toHaveBeenCalledWith(
			"forms/form-1/signed/assignment-1.pdf",
			expect.any(Uint8Array),
			expect.any(Object)
		);
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({
				studentSubmittedAt: expect.any(Date),
				parentRequired: false,
				signedPdfKey: "forms/form-1/signed/assignment-1.pdf"
			})
		);
	});

	it("accepts a student-uploaded scan as the interim final submission", async () => {
		const event = input(
			{},
			{},
			true,
			false,
			new File(["scan"], "signed.png", { type: "image/png" })
		);
		const db = event.locals.db as unknown as { update: ReturnType<typeof vi.fn> };
		const set = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
		db.update.mockReturnValue({ set });
		const bucket = event.platform?.env.FORMS_BUCKET as unknown as { put: ReturnType<typeof vi.fn> };

		expect(await actions.upload(event)).toMatchObject({ success: true });
		expect(bucket.put).toHaveBeenCalledWith(
			"standalone-forms/form-1/uploads/assignment-1.png",
			expect.any(Uint8Array),
			{ httpMetadata: { contentType: "image/png" } }
		);
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({
				studentSubmittedAt: expect.any(Date),
				parentRequired: false,
				signedPdfKey: "standalone-forms/form-1/uploads/assignment-1.png"
			})
		);
	});
});
