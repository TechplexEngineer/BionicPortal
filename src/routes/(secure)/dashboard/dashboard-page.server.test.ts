import { describe, expect, it } from "vitest";
import { load } from "./+page.server";

function input(role: "mentor" | "admin") {
	return {
		locals: {
			user: { id: `${role}-1`, username: `${role}@example.com`, role },
			db: {}
		}
	} as unknown as Parameters<typeof load>[0];
}

describe("dashboard role routing", () => {
	it.each(["mentor", "admin"] as const)(
		"redirects %s users to the admin dashboard",
		async (role) => {
			await expect(load(input(role))).rejects.toMatchObject({
				status: 302,
				location: "/admin"
			});
		}
	);
});
