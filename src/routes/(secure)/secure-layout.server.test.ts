import { describe, expect, it, vi } from "vitest";

const { getRequestEvent } = vi.hoisted(() => ({ getRequestEvent: vi.fn() }));
vi.mock("$app/server", () => ({ getRequestEvent }));

import { load } from "./+layout.server";

function event(pathname: string, mentorApproved: boolean) {
	const value = {
		url: new URL(`http://localhost${pathname}`),
		locals: {
			user: {
				id: "mentor-1",
				username: "mentor@example.com",
				role: "mentor",
				mentorApproved
			},
			db: {}
		}
	};
	getRequestEvent.mockReturnValue(value);
	return value as unknown as Parameters<typeof load>[0];
}

describe("secure layout mentor approval", () => {
	it("redirects pending mentors away from additional secure routes", async () => {
		await expect(load(event("/dashboard", false))).rejects.toMatchObject({
			status: 302,
			location: "/register/mentor"
		});
	});

	it("keeps mentor registration available while approval is pending", async () => {
		await expect(load(event("/register/mentor", false))).resolves.toMatchObject({
			user: { role: "mentor", mentorApproved: false }
		});
	});

	it("allows approved mentors through", async () => {
		await expect(load(event("/dashboard", true))).resolves.toMatchObject({
			user: { role: "mentor", mentorApproved: true }
		});
	});
});
