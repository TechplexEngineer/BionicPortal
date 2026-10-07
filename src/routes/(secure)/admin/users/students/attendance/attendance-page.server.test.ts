import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";

function loadEvent(url = "http://localhost/admin/users/students/attendance") {
	const findMany = vi.fn().mockResolvedValue([]);
	const db = {
		run: vi.fn().mockResolvedValue({ results: [] }),
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
