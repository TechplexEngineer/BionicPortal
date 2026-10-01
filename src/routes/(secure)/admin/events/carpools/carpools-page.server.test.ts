import { describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import { load } from "./+page.server";

describe("admin carpool signup page", () => {
	it("loads only users with the mentor role", async () => {
		const eventsQuery = {
			from: vi.fn().mockResolvedValue([
				{
					id: "event-1",
					data: { name: "Competition", startDate: "2026-10-01", location: "Venue" }
				}
			])
		};
		const mentorsQuery = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([{ id: "mentor-1", username: "mentor@example.com" }])
		};
		const spotsQuery = {
			from: vi.fn().mockResolvedValue([])
		};
		const db = {
			select: vi
				.fn()
				.mockReturnValueOnce(eventsQuery)
				.mockReturnValueOnce(mentorsQuery)
				.mockReturnValueOnce(spotsQuery)
		};

		const result = (await load({ locals: { db } } as unknown as Parameters<typeof load>[0])) as {
			mentors: Array<{ id: string; username: string }>;
		};

		expect(result.mentors).toEqual([{ id: "mentor-1", username: "mentor@example.com" }]);
		expect(mentorsQuery.where).toHaveBeenCalledWith(eq(table.user.role, "mentor"));
	});
});
