import { describe, expect, it, vi } from "vitest";
import { exportFlattenedPdf } from "@team4909/bionic-sign";
import { actions, load } from "./+page.server";

vi.mock("@team4909/bionic-sign", async (importOriginal) => ({
	...(await importOriginal<typeof import("@team4909/bionic-sign")>()),
	exportFlattenedPdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
}));

const definition = {
	version: 1,
	fields: [
		{
			id: "parent-signature",
			name: "parent_signature",
			type: "signature",
			required: true,
			page: 1,
			rect: { x: 0, y: 0, width: 0.3, height: 0.1 }
		}
	]
};

function input(
	linked: boolean,
	submitted: boolean,
	values: object = {},
	dateOfBirth = "2012-01-01"
) {
	const row = {
		assignment: {
			id: "assignment-1",
			studentValues: {},
			studentSubmittedAt: submitted ? new Date() : null,
			parentRequired: true,
			parentCompletedAt: null
		},
		form: {
			id: "form-1",
			name: "Consent",
			basePdfKey: "standalone-forms/form-1/base.pdf",
			definition
		},
		student: { firstName: "Sam", lastName: "Student", dateOfBirth }
	};
	const where = vi.fn().mockResolvedValue(linked ? [row] : []);
	const innerJoin = vi.fn();
	innerJoin.mockReturnValue({ innerJoin, where });
	const db = { select: vi.fn(() => ({ from: vi.fn(() => ({ innerJoin })) })), update: vi.fn() };
	const bucket = { get: vi.fn(), put: vi.fn() };
	const body = new FormData();
	body.set("values", JSON.stringify(values));
	return {
		locals: { db, user: { id: "parent-1" } },
		params: { assignmentId: "assignment-1" },
		request: new Request("http://localhost/dashboard/parent/standalone-forms/assignment-1", {
			method: "POST",
			body
		}),
		platform: { env: { FORMS_BUCKET: bucket } },
		bucket,
		db
	};
}

describe("standalone parent form", () => {
	it("does not expose an unlinked or unfinished student's form", async () => {
		for (const [linked, submitted] of [
			[false, true],
			[true, false]
		]) {
			const event = input(linked, submitted);
			await expect(load(event as never)).rejects.toMatchObject({ status: 404 });
		}
	});

	it("rejects missing required parent fields before writing a PDF", async () => {
		const event = input(true, true);
		const result = await actions.submit(event as never);
		expect(result).toMatchObject({ status: 400 });
		expect(event.bucket.get).not.toHaveBeenCalled();
		expect(event.db.update).not.toHaveBeenCalled();
	});

	it("keeps a pending parent form accessible after the student turns 18", async () => {
		const event = input(true, true, {}, "2008-01-01");
		await expect(load(event as never)).resolves.toMatchObject({ completed: false });
	});

	it("stores the completed parent portion and flattened PDF", async () => {
		const event = input(true, true, {
			parent_signature: { type: "signature", image: "data:image/png;base64,AA==" }
		});
		event.bucket.get.mockResolvedValue({
			arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
		});
		const where = vi.fn().mockResolvedValue(undefined);
		const set = vi.fn(() => ({ where }));
		event.db.update.mockReturnValue({ set });

		expect(await actions.submit(event as never)).toEqual({ success: true });
		expect(exportFlattenedPdf).toHaveBeenCalled();
		expect(event.bucket.put).toHaveBeenCalledWith(
			"standalone-forms/form-1/signed/assignment-1.pdf",
			expect.any(Uint8Array),
			{ httpMetadata: { contentType: "application/pdf" } }
		);
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({ parentCompletedAt: expect.any(Date) })
		);
	});
});
