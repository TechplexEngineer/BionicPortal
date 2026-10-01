import { describe, expect, it, vi } from "vitest";
import * as table from "$lib/server/db/schema";
import { actions, load } from "./+page.server";

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

function loadEvent(students: Record<string, unknown>[]) {
	const studentQuery = {
		from: vi.fn(() => ({
			leftJoin: vi.fn(() => ({
				groupBy: vi.fn(() => ({ where: vi.fn().mockResolvedValue(students) }))
			}))
		}))
	};
	const parentQuery = {
		from: vi.fn(() => ({ innerJoin: vi.fn().mockResolvedValue([]) }))
	};
	const db = {
		select: vi.fn().mockReturnValueOnce(studentQuery).mockReturnValueOnce(parentQuery)
	};

	return {
		input: {
			url: new URL("http://localhost/admin/students"),
			locals: { db }
		} as unknown as Parameters<typeof load>[0],
		db
	};
}

describe("admin student profile status", () => {
	it("returns completion status using the student profile requirements", async () => {
		const { input } = loadEvent([
			completeStudent("complete@example.com"),
			{ ...completeStudent("incomplete@example.com"), currentGrade: "" }
		]);

		const result = await load(input);

		expect(result.students.map((student) => student.profileComplete)).toEqual([true, false]);
	});
});

function deleteEvent(id: string) {
	const db = {
		delete: vi.fn(() => ({
			where: vi.fn().mockImplementation(async () => undefined)
		}))
	};

	return {
		input: {
			request: new Request("http://localhost/admin/students", {
				method: "POST",
				body: new URLSearchParams({ id })
			}),
			locals: { db, user: { role: "admin" } }
		} as unknown as Parameters<typeof actions.delete>[0],
		db
	};
}

function toggleHiddenEvent(id: string) {
	const db = {
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn().mockImplementation(async () => undefined)
			}))
		}))
	};

	return {
		input: {
			request: new Request("http://localhost/admin/students", {
				method: "POST",
				body: new URLSearchParams({ id })
			}),
			locals: { db, user: { role: "admin" } }
		} as unknown as Parameters<typeof actions.toggleHidden>[0],
		db
	};
}

describe("admin student delete", () => {
	it("rejects a missing student ID without writing", async () => {
		const { input, db } = deleteEvent("");

		expect(await actions.delete(input)).toMatchObject({
			status: 400,
			data: { message: "Invalid student ID" }
		});
		expect(db.delete).not.toHaveBeenCalled();
	});

	it("rejects non-admin callers without writing", async () => {
		const { input, db } = deleteEvent("student@example.com");
		(input.locals as { user: { role: string } }).user.role = "mentor";

		expect(await actions.delete(input)).toMatchObject({
			status: 403,
			data: { message: "Admin access required" }
		});
		expect(db.delete).not.toHaveBeenCalled();
	});

	it("deletes dependent records before deleting the student", async () => {
		const { input, db } = deleteEvent("student@example.com");

		expect(await actions.delete(input)).toEqual({ success: true });
		expect(db.delete).toHaveBeenCalledTimes(6);
		expect(
			(db.delete.mock.calls as unknown as [unknown][]).map(([deletedTable]) => deletedTable)
		).toEqual([
			table.parentStudentLinks,
			table.attendance,
			table.eventRegistrations,
			table.roomAssignments,
			table.carpoolAssignments,
			table.students
		]);
	});
});

describe("admin student hidden toggle", () => {
	it("rejects missing IDs without writing", async () => {
		const { input, db } = toggleHiddenEvent("");

		expect(await actions.toggleHidden(input)).toMatchObject({
			status: 400,
			data: { message: "Invalid student ID" }
		});
		expect(db.update).not.toHaveBeenCalled();
	});

	it("rejects non-admin callers without writing", async () => {
		const { input, db } = toggleHiddenEvent("student@example.com");
		(input.locals as { user: { role: string } }).user.role = "mentor";

		expect(await actions.toggleHidden(input)).toMatchObject({
			status: 403,
			data: { message: "Admin access required" }
		});
		expect(db.update).not.toHaveBeenCalled();
	});

	it("atomically toggles the student's hidden status", async () => {
		const { input, db } = toggleHiddenEvent("student@example.com");

		expect(await actions.toggleHidden(input)).toEqual({ success: true });
		expect(db.update).toHaveBeenCalledWith(table.students);
	});
});
