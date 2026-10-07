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
});
