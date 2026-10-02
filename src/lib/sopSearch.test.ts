import { describe, expect, it } from "vitest";
import { searchSops } from "./sopSearch";

describe("searchSops", () => {
	it("returns fuzzy title and content matches", () => {
		const sops = [
			{ title: "Event setup", content: "Prepare the pits" },
			{ title: "Travel checklist", content: "Pack the tool cart" }
		];

		expect(searchSops(sops, "event").map((sop) => sop.title)).toEqual(["Event setup"]);
		expect(searchSops(sops, "tool").map((sop) => sop.title)).toEqual(["Travel checklist"]);
	});
});
