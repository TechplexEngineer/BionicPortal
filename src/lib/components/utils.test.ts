import { describe, it, expect } from "vitest";
import { getParentRoute, isActiveParentRoute } from "./utils";
import type { Page } from "./DashHeader.svelte";

const navPages: Page[] = [
	{
		name: "Dashboard",
		route: "/admin",
		nested: [
			{
				name: "Overview",
				route: "/admin"
			}
		]
	},
	{
		name: "Students",
		route: "/admin/users/students",
		nested: [
			{
				name: "Overview",
				route: "/admin/users/students"
			},
			{
				name: "Import",
				route: "/admin/users/students/import"
			},
			{
				name: "Attendance",
				route: "/admin/users/students/attendance"
			}
		]
	}
];

describe("isActiveParentRoute", () => {
	// it("returns true when current route matches parent route exactly", () => {
	//     expect(isActiveParentRoute("/admin", "/admin", navPages)).toBe(true);
	// });

	// it("returns true when current route is a child of parent route", () => {
	//     expect(isActiveParentRoute("/admin", "/admin/users/students", navPages)).toBe(true);
	// });

	// it("returns false when current route does not match parent route", () => {
	//     expect(isActiveParentRoute("/dashboard", "/profile", navPages)).toBe(false);
	//     expect(isActiveParentRoute("/admin", "/dashboard", navPages)).toBe(false);
	// });

	// it("returns false when parent route is empty", () => {
	//     expect(isActiveParentRoute("", "/dashboard", navPages)).toBe(false);
	// });

	// it("returns false when current route is empty", () => {
	//     expect(isActiveParentRoute("/dashboard", "", navPages)).toBe(false);
	// });

	// it("returns true for nested routes", () => {
	//     expect(isActiveParentRoute("/admin", "/admin/users/students/import", navPages)).toBe(true);
	// });

	// it('', () => {
	//     expect(isActiveParentRoute("/admin/users/students", "/admin/users/students/import", navPages)).toBe(true);
	// })

	it("works for dashboard page", () => {
		//check, current
		expect(isActiveParentRoute("/admin", "/admin", navPages)).toBe(true);
		expect(isActiveParentRoute("/admin/users/students", "/admin", navPages)).toBe(false);
	});

	it("works for students page", () => {
		//check, current
		expect(isActiveParentRoute("/admin", "/admin/users/students", navPages)).toBe(false);
		expect(isActiveParentRoute("/admin/users/students", "/admin/users/students", navPages)).toBe(
			true
		);
	});

	// it("returns false for similar but non-nested routes", () => {
	//     expect(isActiveParentRoute("/admin", "/admining", navPages)).toBe(false);
	// });
});

describe("getParentRoute", () => {
	it("works", () => {
		//check, current
		expect(getParentRoute("/admin", navPages)).toBe("/admin");
		expect(getParentRoute("/admin/users/students", navPages)).toBe("/admin/users/students");
		expect(getParentRoute("/admin/users/students/import", navPages)).toBe("/admin/users/students");
	});
});
