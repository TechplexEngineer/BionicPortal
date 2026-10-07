import { describe, expect, it } from "vitest";
import { getStandaloneAssignmentStatus } from "./standaloneFormStatus";

const parentForm = {
	version: 1,
	fields: [
		{
			id: "p",
			name: "parent_signature",
			type: "signature",
			page: 1,
			rect: { x: 0, y: 0, width: 0.5, height: 0.1 },
			required: true
		}
	]
};
const plainForm = { version: 1, fields: [] };

describe("standalone dashboard status", () => {
	it("shows every assigned form and treats a submitted student portion as pending until the required parent portion is complete", () => {
		const pending = getStandaloneAssignmentStatus(
			"a",
			"Permission",
			parentForm,
			new Date(),
			null,
			true,
			"2012-01-01"
		);
		expect(pending).toMatchObject({
			id: "a",
			name: "Permission",
			studentSubmitted: true,
			parentRequired: true,
			submitted: false
		});
		const complete = getStandaloneAssignmentStatus(
			"a",
			"Permission",
			parentForm,
			new Date(),
			new Date(),
			true,
			"2012-01-01"
		);
		expect(complete.submitted).toBe(true);
	});

	it("marks a student-only form submitted once the student submits it", () => {
		const item = getStandaloneAssignmentStatus(
			"b",
			"Survey",
			plainForm,
			new Date(),
			null,
			false,
			null
		);
		expect(item).toMatchObject({ studentSubmitted: true, parentRequired: false, submitted: true });
	});

	it("keeps a previously required parent portion pending after the student's eighteenth birthday", () => {
		const afterBirthday = getStandaloneAssignmentStatus(
			"c",
			"Permission",
			parentForm,
			new Date("2026-01-01"),
			null,
			true,
			"2008-03-01",
			new Date("2026-10-06")
		);
		expect(afterBirthday).toMatchObject({ parentRequired: true, submitted: false });
	});
});
