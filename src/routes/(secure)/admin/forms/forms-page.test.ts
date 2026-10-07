import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageMarkup = readFileSync(resolve(import.meta.dirname, "+page.svelte"), "utf8");

describe("standalone form deletion", () => {
	it("cancels the enhanced delete submission through SvelteKit", () => {
		const deleteForm = pageMarkup.match(/<form[\s\S]*?action="\?\/delete"[\s\S]*?<\/form>/)?.[0];

		expect(deleteForm).toBeDefined();
		expect(deleteForm).toContain("use:enhance={({ cancel }) =>");
		expect(deleteForm).toContain("cancel();");
		expect(deleteForm).toContain("return;");
		expect(deleteForm).not.toContain("onsubmit=");
	});
});
