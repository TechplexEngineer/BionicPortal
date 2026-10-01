import { describe, expect, it, vi } from "vitest";
import { getDb } from "$lib/server/db";
import { actions } from "./+page.server";

vi.mock("$lib/server/db", () => ({ getDb: vi.fn() }));

function createDb() {
	const set = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));
	const update = vi.fn(() => ({ set }));
	return { update, set };
}

function actionInput(db: ReturnType<typeof createDb>, needsCarpool: boolean) {
	const formData = new FormData();
	formData.set("name", "Regional");
	formData.set("startDate", "2030-01-01");
	formData.set("endDate", "2030-01-02");
	formData.set("location", "Billerica");
	formData.set("cost", "100");
	if (needsCarpool) formData.set("needsCarpool", "on");

	return {
		request: new Request("http://localhost/admin/events/event-1/edit", {
			method: "POST",
			body: formData
		}),
		locals: { db },
		params: { id: "event-1" }
	} as unknown as Parameters<typeof actions.default>[0];
}

describe("event edit carpool flag", () => {
	it.each([true, false])("persists needsCarpool=%s", async (needsCarpool) => {
		const db = createDb();
		vi.mocked(getDb).mockReturnValue(db as never);

		await expect(actions.default(actionInput(db, needsCarpool))).rejects.toMatchObject({
			status: 303,
			location: "/admin/events"
		});
		expect(db.set).toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ needsCarpool }) })
		);
	});
});
