import { describe, expect, it } from "vitest";
import { canAccessAdmin, canWriteAdmin, canWriteAdminRequest } from "./adminAccess";

describe("admin access", () => {
	it("allows mentors and admins to read admin pages", () => {
		expect(canAccessAdmin({ role: "mentor" } as never)).toBe(true);
		expect(canAccessAdmin({ role: "admin" } as never)).toBe(true);
		expect(canAccessAdmin({ role: "user" } as never)).toBe(false);
	});

	it("allows only admins to write", () => {
		expect(canWriteAdmin({ role: "admin" } as never)).toBe(true);
		expect(canWriteAdmin({ role: "mentor" } as never)).toBe(false);
	});

	it("blocks mentor writes under the admin route while allowing reads", () => {
		const mentor = { role: "mentor" } as never;
		expect(canWriteAdminRequest("/admin/events", "POST", mentor)).toBe(false);
		expect(canWriteAdminRequest("/admin/events", "GET", mentor)).toBe(true);
		expect(canWriteAdminRequest("/compete", "POST", mentor)).toBe(true);
	});
});
