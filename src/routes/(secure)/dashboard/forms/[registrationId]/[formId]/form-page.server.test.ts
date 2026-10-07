import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";

function input(upload: File) {
	const submission = {
		id: "submission-1",
		studentValues: {},
		parentValues: {},
		studentCompleted: false,
		parentCompleted: false
	};
	const row = {
		registration: { id: "registration-1", studentId: "student@example.com" },
		form: {
			id: "form-1",
			name: "Permission",
			definition: { version: 1, fields: [] }
		},
		event: { id: "event-1", data: { name: "Event", startDate: "2026-01-01" } },
		student: { userid: "student@example.com", dateOfBirth: "2012-01-01", parentEmails: null },
		submission
	};
	const where = vi.fn().mockResolvedValue([row]);
	const db = {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				innerJoin: vi.fn(() => ({
					innerJoin: vi.fn(() => ({
						innerJoin: vi.fn(() => ({
							leftJoin: vi.fn(() => ({ where }))
						}))
					}))
				}))
			}))
		})),
		update: vi.fn()
	};
	const body = new FormData();
	body.set("upload", upload);
	return {
		request: new Request("http://localhost/dashboard/forms/registration-1/form-1", {
			method: "POST",
			body
		}),
		locals: { db, user: { username: "student@example.com" } },
		params: { registrationId: "registration-1", formId: "form-1" },
		platform: { env: { FORMS_BUCKET: { put: vi.fn().mockResolvedValue(undefined) } } }
	} as unknown as Parameters<typeof actions.upload>[0];
}

describe("event student form upload", () => {
	it("stores an uploaded scan and completes the interim submission", async () => {
		const event = input(new File(["scan"], "signed.pdf", { type: "application/pdf" }));
		const db = event.locals.db as unknown as { update: ReturnType<typeof vi.fn> };
		const set = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
		db.update.mockReturnValue({ set });

		expect(await actions.upload(event)).toMatchObject({ success: true });
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({
				studentCompleted: true,
				parentCompleted: true,
				signedPdfKey: "forms/form-1/registration-1/uploads/submission-1.pdf"
			})
		);
	});
});
