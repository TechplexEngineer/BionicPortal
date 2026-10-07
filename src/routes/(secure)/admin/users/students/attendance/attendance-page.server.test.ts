import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";

function loadEvent(
	url = "http://localhost/admin/users/students/attendance",
	meetings: { date: string; count: number }[] = []
) {
	const findMany = vi.fn().mockResolvedValue([]);
	const db = {
		run: vi.fn().mockResolvedValue({ results: meetings }),
		query: { students: { findMany } }
	};

	return {
		input: {
			url: new URL(url),
			locals: { db }
		} as unknown as Parameters<typeof load>[0],
		findMany
	};
}

describe("admin student attendance visibility", () => {
	it("returns meetings newest first for date column rendering", async () => {
		const { input } = loadEvent("http://localhost/admin/users/students/attendance", [
			{ date: "2026-09-01", count: 1 },
			{ date: "2026-10-01", count: 2 }
		]);

		const result = await load(input);

		expect(result.meetings.map((meeting) => meeting.date)).toEqual(["2026-10-01", "2026-09-01"]);
	});

	it("filters out hidden students and last year's graduates by default", async () => {
		const { input, findMany } = loadEvent();

		const result = await load(input);

		const query = findMany.mock.calls[0][0];
		expect(query.where).toBeDefined();
		expect(result).toMatchObject({ showArchived: false });
	});

	it("loads archived students when the overview filter is enabled", async () => {
		const { input, findMany } = loadEvent(
			"http://localhost/admin/users/students/attendance?showArchived=true"
		);

		const result = await load(input);

		expect(findMany).toHaveBeenCalledWith({
			where: undefined,
			with: {
				attendance: {
					where: expect.any(Function)
				}
			}
		});
		expect(result).toMatchObject({ showArchived: true });
	});
});
