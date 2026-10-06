import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { render } from "svelte/server";
import { vi } from "vitest";
import { getDb } from "$lib/server/db";
import { load } from "./+page.server";
import Page from "./+page.svelte";

vi.mock("$lib/server/db", () => ({ getDb: vi.fn() }));

const pageMarkup = readFileSync(resolve(import.meta.dirname, "+page.svelte"), "utf8");

describe("admin event deletion", () => {
	it("cancels the enhanced submission before setting the deleting state", () => {
		const deleteForm = pageMarkup.match(/<form[\s\S]*?action="\?\/delete"[\s\S]*?<\/form>/)?.[0];

		expect(deleteForm).toBeDefined();
		expect(deleteForm).toContain("use:enhance={({ cancel }) =>");
		expect(deleteForm).toContain("cancel();");
		expect(deleteForm).not.toContain("onsubmit=");
		expect(deleteForm?.indexOf("cancel();")).toBeLessThan(
			deleteForm!.indexOf("deletingId = event.id")
		);
	});
});

describe("event form counts", () => {
	it("loads saved form counts for each event, ignoring legacy form URLs", async () => {
		const sqlite = new Database(":memory:");
		try {
			sqlite.exec(`
				CREATE TABLE events (id TEXT PRIMARY KEY, data TEXT NOT NULL);
				CREATE TABLE event_forms (id TEXT PRIMARY KEY, event_id TEXT NOT NULL);
			`);
			for (const [id, name] of [
				["one", "One"],
				["two", "Two"],
				["none", "None"]
			]) {
				sqlite.prepare("INSERT INTO events VALUES (?, ?)").run(
					id,
					JSON.stringify({
						name,
						startDate: "2030-01-01",
						endDate: "2030-01-02",
						location: "Billerica",
						permissionFormUrl: id === "none" ? "https://example.com/old.pdf" : undefined
					})
				);
			}
			for (const [id, eventId] of [
				["form-1", "one"],
				["form-2", "two"],
				["form-3", "two"]
			]) {
				sqlite.prepare("INSERT INTO event_forms VALUES (?, ?)").run(id, eventId);
			}
			vi.mocked(getDb).mockReturnValue(drizzle(sqlite) as never);

			const result = await load({} as Parameters<typeof load>[0]);
			expect(Object.fromEntries(result.events.map(({ id, formCount }) => [id, formCount]))).toEqual(
				{
					one: 1,
					two: 2,
					none: 0
				}
			);
		} finally {
			sqlite.close();
		}
	});

	it("shows a forms management link with the count on every card", () => {
		const event = {
			name: "Regional",
			startDate: "2030-01-01",
			endDate: "2030-01-02",
			location: "Billerica",
			isOvernight: false
		};
		const { body } = render(Page, {
			props: {
				data: {
					events: [
						{ ...event, id: "with-forms", formCount: 2 },
						{ ...event, id: "without-forms", formCount: 0 }
					]
				}
			} as never
		});

		expect(body).toMatch(
			/href="\/admin\/events\/with-forms\/forms"[^>]*>[^<]*(?:<[^>]+>)*\s*Forms \(2\)/
		);
		expect(body).toMatch(
			/href="\/admin\/events\/without-forms\/forms"[^>]*>[^<]*(?:<[^>]+>)*\s*Forms \(0\)/
		);
	});
});
