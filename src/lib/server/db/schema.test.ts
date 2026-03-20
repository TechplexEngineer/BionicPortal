import { expect, describe, it } from "vitest";
import { students } from "./schema";
import { getTableColumns } from "drizzle-orm";

describe("Database Schema tests", () => {
	it("students schema has currentGrade and gender columns", () => {
		const columns = getTableColumns(students);
		expect(columns).toHaveProperty("currentGrade");
		expect(columns).toHaveProperty("gender");
	});
});
