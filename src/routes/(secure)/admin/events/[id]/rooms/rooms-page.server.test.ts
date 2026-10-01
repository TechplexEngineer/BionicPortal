import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";

describe("admin room assignments page", () => {
	it("does not query assignments when the event has no rooms", async () => {
		const select = vi
			.fn()
			.mockImplementationOnce(() => query([{ id: "event-1", data: overnightEvent }]))
			.mockImplementationOnce(() => query([]))
			.mockImplementationOnce(() => query([]))
			.mockImplementationOnce(() => query([]));

		const result = await load({
			locals: { db: { select } },
			params: { id: "event-1" }
		} as never);

		expect(result).toMatchObject({ rooms: [], assignments: [], attendees: [] });
		expect(select).toHaveBeenCalledTimes(4);
	});
});

const overnightEvent = {
	name: "Overnight event",
	startDate: "2026-01-01",
	endDate: "2026-01-02",
	location: "Somewhere",
	isOvernight: true,
	departureTime: "2026-01-01T08:00",
	returnTime: "2026-01-02T17:00",
	cost: 0,
	studentsPerRoom: 4,
	mentorsPerRoom: 2
};

function query<T>(result: T) {
	const builder = {
		from: () => builder,
		innerJoin: () => builder,
		where: async () => result
	};

	return builder;
}
