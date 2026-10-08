import { describe, expect, it, vi } from "vitest";
import { render } from "svelte/server";
import Page from "./+page.svelte";

vi.mock("$app/state", () => ({ page: { url: new URL("http://localhost/dashboard") } }));

describe("dashboard navigation", () => {
	it("shows students the SOP navigation entry", () => {
		const { body } = render(Page, {
			props: {
				data: {
					role: "user",
					profileCompleteness: { incomplete: false },
					assignedForms: [],
					actionItems: [],
					upcomingRegistrations: []
				}
			} as never
		});

		expect(body).toMatch(/<a[^>]*href="\/sops"[^>]*>SOPs<\/a>/);
	});

	it("shows an explicit profile completion button for incomplete students", () => {
		const { body } = render(Page, {
			props: {
				data: {
					role: "user",
					profileCompleteness: {
						incomplete: true,
						missingFields: ["date of birth"],
						href: "/register"
					},
					assignedForms: [],
					actionItems: [],
					upcomingRegistrations: []
				}
			} as never
		});

		expect(body).toMatch(
			/<a[^>]*href="\/register\?returnTo=%2Fdashboard"[^>]*class="btn btn-danger btn-sm mt-2"[^>]*>Complete profile<\/a>/
		);
	});
});
