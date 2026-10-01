import { describe, expect, it, vi } from "vitest";
import * as table from "$lib/server/db/schema";
import { load } from "./+page.server";

describe("admin parents page", () => {
	it("loads parent users with their linked students", async () => {
		const parentQuery = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([
				{ id: "parent-1", username: "parent@example.com" },
				{ id: "parent-2", username: "other@example.com" }
			])
		};
		const linkQuery = {
			from: vi.fn().mockReturnThis(),
			innerJoin: vi.fn().mockResolvedValue([
				{
					parentId: "parent-1",
					studentId: "student@example.com",
					studentFirstName: "Alex",
					studentLastName: "Student"
				}
			])
		};
		const db = {
			select: vi.fn().mockReturnValueOnce(parentQuery).mockReturnValueOnce(linkQuery)
		};

		const result = await load({ locals: { db } } as unknown as Parameters<typeof load>[0]);

		expect(result).toEqual({
			parents: [
				{
					id: "parent-1",
					username: "parent@example.com",
					students: [
						{
							parentId: "parent-1",
							studentId: "student@example.com",
							studentFirstName: "Alex",
							studentLastName: "Student"
						}
					]
				},
				{ id: "parent-2", username: "other@example.com", students: [] }
			]
		});
		expect(db.select).toHaveBeenNthCalledWith(1, {
			id: table.user.id,
			username: table.user.username
		});
	});
});
