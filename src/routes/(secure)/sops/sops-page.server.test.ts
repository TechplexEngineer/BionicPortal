import { describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import { actions, load } from "./+page.server";

function dbWithSops(sops: unknown[]) {
	const query = {
		from: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockResolvedValue(sops)
	};
	return { select: vi.fn().mockReturnValue(query) };
}

describe("SOP access", () => {
	it("allows mentors to read SOPs", async () => {
		const result = await load({
			locals: {
				user: {
					id: "mentor",
					role: "mentor",
					username: "mentor@example.com",
					mentorApproved: true
				},
				db: dbWithSops([])
			},
			url: new URL("http://localhost/sops")
		} as unknown as Parameters<typeof load>[0]);

		expect(result.user.role).toBe("mentor");
		expect(result.sops).toEqual([]);
	});

	it("keeps SOP writes admin-only", async () => {
		await expect(
			actions.create({
				locals: {
					user: {
						id: "mentor",
						role: "mentor",
						username: "mentor@example.com",
						mentorApproved: true
					}
				},
				request: new Request("http://localhost/sops", { method: "POST" })
			} as unknown as Parameters<NonNullable<typeof actions.create>>[0])
		).rejects.toMatchObject({ status: 302, location: "/dashboard" });
	});

	it("deletes only the SOP identified by the form", async () => {
		const where = vi.fn().mockResolvedValue({ success: true });
		const db = {
			delete: vi.fn().mockReturnValue({ where })
		};

		await actions.delete({
			locals: { user: { id: "admin", role: "admin" }, db },
			request: new Request("http://localhost/sops", {
				method: "POST",
				body: new URLSearchParams({ id: "sop-to-delete" })
			})
		} as unknown as Parameters<NonNullable<typeof actions.delete>>[0]);

		expect(db.delete).toHaveBeenCalledWith(table.sops);
		expect(where).toHaveBeenCalledWith(eq(table.sops.id, "sop-to-delete"));
	});
});
