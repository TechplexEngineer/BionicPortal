import { describe, expect, it, vi } from "vitest";

const { getRequestEvent } = vi.hoisted(() => ({ getRequestEvent: vi.fn() }));
vi.mock("$app/server", () => ({ getRequestEvent }));

import { load } from "./+layout.server";

function event(pathname: string) {
	const value = {
		url: new URL(`http://localhost${pathname}`),
		locals: {
			user: {
				id: "mentor-1",
				username: "mentor@example.com",
				role: "mentor"
			},
			db: {}
		}
	};
	getRequestEvent.mockReturnValue(value);
	return value as unknown as Parameters<typeof load>[0];
}

describe("secure layout authentication", () => {
	it("allows mentors through every secure route", async () => {
		await expect(load(event("/register/mentor"))).resolves.toMatchObject({
			user: { role: "mentor" }
		});
	});
});
