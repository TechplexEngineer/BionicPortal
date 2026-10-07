import { describe, expect, it, vi } from "vitest";
import { GET } from "./+server";

function exportEvent(url = "http://localhost/admin/users/students/export") {
	const rows = [
		{ firstName: "Alice", lastName: 'O"Neil' },
		{ firstName: "Bob", lastName: "Student" }
	];
	const orderBy = vi.fn().mockResolvedValue(rows);
	const where = vi.fn(() => ({ orderBy }));
	const from = vi.fn(() => ({ where, orderBy }));
	const db = { select: vi.fn(() => ({ from })) };

	return {
		input: { url: new URL(url), locals: { db } } as unknown as Parameters<typeof GET>[0],
		where,
		orderBy
	};
}

describe("student name CSV export", () => {
	it("downloads active students in last-name, first-name order as an escaped CSV", async () => {
		const { input, where, orderBy } = exportEvent();

		const response = await GET(input);

		expect(where).toHaveBeenCalledOnce();
		expect(orderBy).toHaveBeenCalledOnce();
		expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
		expect(response.headers.get("content-disposition")).toBe('attachment; filename="students.csv"');
		expect(await response.text()).toBe(
			'"First Name","Last Name"\r\n"Alice","O""Neil"\r\n"Bob","Student"'
		);
	});

	it("includes archived students when the overview filter is enabled", async () => {
		const { input, where } = exportEvent(
			"http://localhost/admin/users/students/export?showArchived=true"
		);

		await GET(input);

		expect(where).toHaveBeenCalledWith(undefined);
	});
});
