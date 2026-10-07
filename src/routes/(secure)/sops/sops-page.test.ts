// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import Page from "./+page.svelte";

vi.mock("$app/state", () => ({ page: { url: new URL("http://localhost/sops?id=one") } }));

afterEach(cleanup);

const updatedAt = new Date("2026-10-07T12:00:00Z");
const first = {
	id: "one",
	title: "Shared SOP",
	content: "First draft",
	private: false,
	archived: false,
	updatedAt
};
const second = {
	id: "two",
	title: "Private SOP",
	content: "Second draft",
	private: true,
	archived: false,
	updatedAt
};

function renderSopPage(selectedSop = first) {
	return render(Page, {
		data: {
			user: { role: "mentor" },
			sops: [first, second],
			selectedSop
		}
	} as never);
}

async function openFirstEditor() {
	const page = renderSopPage();
	await fireEvent.click(screen.getByRole("button", { name: "Edit" }));
	return page;
}

function selectionLink(name: string) {
	const link = screen.getByRole("link", { name: new RegExp(name) });
	link.addEventListener("click", (event) => event.preventDefault());
	return link;
}

const pageMarkup = readFileSync(resolve(import.meta.dirname, "+page.svelte"), "utf8");

function actionForm(action: string) {
	const actionIndex = pageMarkup.indexOf(`action="?/${action}"`);
	if (actionIndex === -1) return undefined;
	const start = pageMarkup.lastIndexOf("<form", actionIndex);
	const end = pageMarkup.indexOf("</form>", actionIndex);
	return start === -1 || end === -1 ? undefined : pageMarkup.slice(start, end + "</form>".length);
}

describe("SOP page", () => {
	it("closes the current editor before selecting another SOP", async () => {
		await openFirstEditor();
		expect(screen.getByRole("button", { name: "Save SOP" })).toBeTruthy();
		await fireEvent.click(selectionLink("Private SOP"));
		expect(screen.queryByRole("button", { name: "Save SOP" })).toBeNull();
	});

	it("keeps the draft open when selecting the current SOP", async () => {
		await openFirstEditor();
		await fireEvent.click(selectionLink("Shared SOP"));
		expect(screen.getByRole("button", { name: "Save SOP" })).toBeTruthy();
	});

	it.each([
		["meta", { metaKey: true }],
		["control", { ctrlKey: true }],
		["shift", { shiftKey: true }],
		["middle", { button: 1 }]
	])("keeps the draft open for a %s click on another SOP", async (_, options) => {
		await openFirstEditor();
		await fireEvent.click(selectionLink("Private SOP"), options);
		expect(screen.getByRole("button", { name: "Save SOP" })).toBeTruthy();
	});

	it("keeps the draft open for a new-tab link", async () => {
		await openFirstEditor();
		const link = selectionLink("Private SOP");
		link.setAttribute("target", "_blank");
		await fireEvent.click(link);
		expect(screen.getByRole("button", { name: "Save SOP" })).toBeTruthy();
	});

	it("closes an edit when the selected SOP changes outside a link click", async () => {
		const page = await openFirstEditor();
		expect((screen.getByRole("textbox", { name: "Title" }) as HTMLInputElement).value).toBe(
			"Shared SOP"
		);
		await page.rerender({
			data: {
				user: { role: "mentor" },
				sops: [first, second],
				selectedSop: second
			}
		} as never);
		expect(screen.queryByRole("button", { name: "Save SOP" })).toBeNull();
		expect(screen.getByRole("heading", { name: "Private SOP" })).toBeTruthy();
	});

	it("keeps the edit form target bound to the SOP selected when editing began", async () => {
		await openFirstEditor();
		const editForm = screen.getByRole("button", { name: "Save SOP" }).closest("form");
		expect(editForm?.querySelector<HTMLInputElement>('input[name="id"]')?.value).toBe("one");
		expect(pageMarkup).toContain("value={editingSopId}");
	});

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
		expect(pageMarkup).toContain("await goto(destination)");
		expect(pageMarkup).toContain('editorMode = "new"');
		expect(pageMarkup).toContain('action={editorMode === "edit" ? "?/update" : "?/create"}');
		expect(pageMarkup).toContain('{#if editorMode === "edit" && editingSopId}');
		expect(pageMarkup).toContain("editorMode = null");
	});

	it("opens a newly created SOP in the active view while keeping an edit in its current view", () => {
		expect(pageMarkup).toContain(
			"const activeHref = (id: string) => resolve(`/sops?id=${encodeURIComponent(id)}`)"
		);
		expect(pageMarkup).toMatch(
			/use:enhance=\{\(\) => \{\s*const wasCreating = editorMode === "new";\s*return async/
		);
		expect(pageMarkup).toContain(
			"const destination = wasCreating ? activeHref(id) : selectedHref(id)"
		);
		expect(pageMarkup).toMatch(
			/const destination = [^;]+;\s*editorMode = null;\s*await goto\(destination\)/
		);
	});

	it("lets admins and mentors open the editor while students cannot", () => {
		expect(pageMarkup).toContain("const isManager = $derived(");
		expect(pageMarkup).toContain('data.user.role === "admin" || data.user.role === "mentor"');
		expect(pageMarkup).toContain('const isStudent = $derived(data.user.role === "user")');
		expect(pageMarkup).toMatch(/\{#if isManager\}[\s\S]*?<button[\s\S]*?New SOP[\s\S]*?<\/button>/);
		expect(pageMarkup).toMatch(/\{#if isManager\}<button[\s\S]*?Edit<\/button\s*>/);
		expect(pageMarkup).toContain("{#if isManager && editorMode !== null &&");
	});

	it("defaults the new editor to private and binds sharing when editing", () => {
		expect(pageMarkup).toContain("draftShared = false;");
		expect(pageMarkup).toContain("draftShared = data.selectedSop?.private === false;");
		expect(pageMarkup).toMatch(
			/<input[\s\S]*?type="checkbox"[\s\S]*?name="shareWithStudents"[\s\S]*?bind:checked=\{draftShared\}/
		);
		expect(pageMarkup).toContain("Share with students");
	});

	it("offers the archived view only to managers and keeps list links in that view", () => {
		expect(pageMarkup).toContain('page.url.searchParams.get("archived") === "1"');
		expect(pageMarkup).toMatch(/\{#if isManager\}[\s\S]*?href=\{resolve\("\/sops\?archived=1"\)\}/);
		expect(pageMarkup).toContain('href={resolve("/sops")}');
		expect(pageMarkup).toContain('archivedView ? "archived=1&" : ""');
		expect(pageMarkup).toContain("id=${encodeURIComponent(id)}");
	});

	it("shows archive to students, restore only to managers, and delete only to admins", () => {
		expect(pageMarkup).toMatch(/\{#if isManager \|\| isStudent\}[\s\S]*?action="\?\/archive"/);
		expect(pageMarkup).toMatch(/\{#if !data.selectedSop.archived\}[\s\S]*?action="\?\/archive"/);
		expect(pageMarkup).toMatch(
			/\{#if isManager && data.selectedSop.archived\}[\s\S]*?action="\?\/restore"/
		);
		expect(pageMarkup).toMatch(/\{#if isAdmin\}[\s\S]*?action="\?\/delete"/);
		expect(pageMarkup).toContain('name="id" value={data.selectedSop.id}');
		expect(pageMarkup).toContain("Archive SOP");
		expect(pageMarkup).toContain("Restore SOP");
		expect(pageMarkup).toContain("Delete SOP");
	});

	it("returns to the active SOP list after successful archive, restore, or delete", () => {
		for (const action of ["archive", "restore", "delete"]) {
			const form = actionForm(action);
			expect(form, `${action} form`).toBeDefined();
			expect(form).toContain("use:enhance=");
			expect(form).toContain('result.type === "success"');
			expect(form).toContain('await goto(resolve("/sops"))');
		}
	});

	it("cancels delete before enhanced submission", () => {
		const deleteForm = actionForm("delete");

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
