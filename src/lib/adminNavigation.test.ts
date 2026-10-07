import { describe, expect, it } from "vitest";
import { adminNavPages } from "./adminNavigation";

describe("admin navigation", () => {
	it("includes direct links to the dashboard sections and SOPs", () => {
		expect(adminNavPages.map(({ name, route }) => [name, route])).toEqual([
			["Dashboard", "/admin"],
			["Students", "/admin/students"],
			["Parents", "/admin/parents"],
			["Users", "/admin/users"],
			["Events", "/admin/events"],
			["Forms", "/admin/forms"],
			["Shop", "/admin/shop"],
			["SOPs", "/sops"]
		]);
		expect(adminNavPages.at(-1)?.nested).toEqual([{ name: "Overview", route: "/sops" }]);
	});
});
