import { describe, expect, it, vi } from "vitest";
import { render } from "svelte/server";
import * as table from "$lib/server/db/schema";
import { load } from "./+page.server";
import Page from "./+page.svelte";

function completeStudent(userid: string) {
	return {
		userid,
		firstName: "Alex",
		lastName: "Student",
		parentNames: "Parent Student",
		parentEmails: "parent@example.com",
		phone: "555-0100",
		parentPhone: "555-0101",
		dietaryRestrictions: "None",
		intoleranceLevel: "prefer_not",
		graduationYear: "2030",
		tshirtSize: "M",
		customFields: JSON.stringify({
			aspirationsAfterHighSchool: "College",
			winterSpringSports: "Soccer",
			teamGoals: "Learn"
		}),
		currentGrade: "9",
		gender: "X",
		dateOfBirth: "2015-01-01",
		hidden: false
	};
}

function createDb({ events, registrations, students }: Record<string, unknown[]>) {
	const queries = new Map<unknown, unknown[]>([
		[table.events, events],
		[table.eventRegistrations, registrations],
		[table.students, students]
	]);

	return {
		select: vi.fn((selection?: unknown) => ({
			from: vi.fn((source: unknown) => {
				const rows = queries.get(source) ?? [];
				if (selection) {
					return { groupBy: vi.fn().mockResolvedValue(rows) };
				}
				return Promise.resolve(rows);
			})
		}))
	};
}

describe("admin dashboard overview", () => {
	it("returns event registration counts and active student profile metrics", async () => {
		const db = createDb({
			events: [
				{
					id: "event-1",
					data: { name: "Regional", startDate: "2030-01-01" }
				},
				{ id: "event-2", data: { name: "Outreach", startDate: "2030-02-01" } }
			],
			registrations: [{ eventId: "event-1" }, { eventId: "event-1" }, { eventId: "event-1" }],
			students: [
				completeStudent("complete@example.com"),
				{ ...completeStudent("incomplete@example.com"), currentGrade: "" },
				{ ...completeStudent("hidden@example.com"), hidden: true }
			]
		});

		const result = await load({ locals: { db } } as unknown as Parameters<typeof load>[0]);

		expect(result.events.map(({ id, registrationCount }) => [id, registrationCount])).toEqual([
			["event-1", 3],
			["event-2", 0]
		]);
		expect(result.studentOverview).toEqual({ total: 2, profileComplete: 1, profilePercent: 50 });
	});

	it("renders the overview metrics and event registration counts", () => {
		const { body } = render(Page, {
			props: {
				data: {
					events: [
						{ id: "event-1", name: "Regional", startDate: "2030-01-01", registrationCount: 3 }
					],
					studentOverview: { total: 12, profileComplete: 9, profilePercent: 75 }
				}
			} as never
		});

		expect(body).toContain("12");
		expect(body).toContain("75%");
		expect(body).toContain("9 of 12 profiles complete");
		expect(body).toContain("Regional");
		expect(body).toContain("3 students registered");
	});
});
