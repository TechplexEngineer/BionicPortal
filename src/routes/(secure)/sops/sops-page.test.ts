import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageMarkup = readFileSync(resolve(import.meta.dirname, "+page.svelte"), "utf8");

describe("SOP page", () => {
	it("shows the shared admin dashboard tabs to admins", () => {
		const adminLayout = readFileSync(
			resolve(import.meta.dirname, "../admin/+layout.svelte"),
			"utf8"
		);

		expect(adminLayout).toContain('import { adminNavPages } from "$lib/adminNavigation"');
		expect(pageMarkup).toContain('import DashHeader from "$lib/components/DashHeader.svelte"');
		expect(pageMarkup).toContain('import { adminNavPages } from "$lib/adminNavigation"');
		expect(pageMarkup).toMatch(
			/\{#if isAdmin\}[\s\S]*?<DashHeader pages=\{adminNavPages\} \/>[\s\S]*?\{\/if\}/
		);
	});

	it("uses full GitHub-flavored Markdown rendering and renders the saved SOP", () => {
		expect(pageMarkup).toContain('import SvelteMarkdown from "@humanspeak/svelte-markdown"');
		expect(pageMarkup).toContain("<SvelteMarkdown source={data.selectedSop.content} />");
		expect(pageMarkup).toContain("goto(selectedHref(String(result.data.id)))");
		expect(pageMarkup).toContain('editorMode = "new"');
		expect(pageMarkup).toContain('action={editorMode === "edit" ? "?/update" : "?/create"}');
		expect(pageMarkup).toContain('{#if editorMode === "edit" && data.selectedSop}');
		expect(pageMarkup).toContain("editorMode = null");
	});

	it("cancels delete before enhanced submission", () => {
		const deleteForm = pageMarkup.match(/<form[\s\S]*?action="\?\/delete"[\s\S]*?<\/form>/)?.[0];

		expect(deleteForm).toBeDefined();
		expect(deleteForm).toContain("use:enhance={({ cancel }) =>");
		expect(deleteForm).toContain("cancel();");
		expect(deleteForm).toContain("return;");
		expect(deleteForm).not.toContain("onsubmit=");
		expect(deleteForm?.indexOf("cancel();")).toBeLessThan(deleteForm!.indexOf("return;"));
		expect(deleteForm).toContain('name="id" value={data.selectedSop.id}');
		expect(deleteForm).toContain('goto(resolve("/sops"))');
	});
});
