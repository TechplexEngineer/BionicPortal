import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";

function createDb(needsCarpool: boolean) {
	const insert = vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }));
	const select = vi.fn(() => ({
		from: vi.fn(() => ({
			where: vi.fn().mockResolvedValue([{ data: { needsCarpool } }])
		}))
	}));

	return { insert, select };
}

function actionInput(db: ReturnType<typeof createDb>) {
	const formData = new FormData();
	formData.set("mentorId", "mentor-1");
	formData.set("capacity", "4");
	formData.set("driverName", "Alex");

	return {
		request: new Request("http://localhost/admin/events/event-1/carpools", {
			method: "POST",
			body: formData
		}),
		locals: { db },
		params: { id: "event-1" }
	} as unknown as Parameters<NonNullable<typeof actions.createSpot>>[0];
}

describe("event carpool creation", () => {
	it("rejects carpool spots when the event does not need a carpool", async () => {
		const db = createDb(false);

		await expect(actions.createSpot(actionInput(db))).resolves.toMatchObject({
			status: 400,
			data: { message: "Carpooling is not enabled for this event" }
		});
		expect(db.insert).not.toHaveBeenCalled();
	});

	it("creates a carpool spot when the event needs a carpool", async () => {
		const db = createDb(true);

		await expect(actions.createSpot(actionInput(db))).resolves.toEqual({ success: true });
		expect(db.insert).toHaveBeenCalled();
	});
});
