import { describe, expect, it } from "vitest";
import { adminNavPages } from "./adminNavigation";

describe("admin navigation", () => {
	it("includes direct links to the dashboard sections and SOPs", () => {
		expect(adminNavPages.map(({ name, route }) => [name, route])).toEqual([
			["Dashboard", "/admin"],
			["Users", "/admin/users"],
			["Events", "/admin/events"],
			["Forms", "/admin/forms"],
			["Shop", "/admin/shop"],
			["SOPs", "/sops"]
		]);
		expect(adminNavPages.find(({ name }) => name === "Users")?.nested).toEqual([
			{ name: "Overview", route: "/admin/users" },
			{ name: "Create User", route: "/admin/users/new" },
			{ name: "Students", route: "/admin/users/students" },
			{ name: "Import Students", route: "/admin/users/students/import" },
			{ name: "Student Attendance", route: "/admin/users/students/attendance" },
			{ name: "Parents", route: "/admin/users/parents" }
		]);
		expect(adminNavPages.at(-1)?.nested).toEqual([{ name: "Overview", route: "/sops" }]);
	});
});
