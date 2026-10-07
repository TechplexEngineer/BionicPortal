import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const layoutMarkup = readFileSync(resolve(import.meta.dirname, "+layout.server.ts"), "utf8");

describe("admin layout authorization", () => {
	it("allows mentors and admins into the admin route tree", () => {
		expect(layoutMarkup).toMatch(/canAccessAdmin\(locals\.user\)/);
		expect(layoutMarkup).toMatch(/redirect\(302, "\/dashboard"\)/);
	});

	it("keeps non-mentor users out of the admin route tree", () => {
		expect(layoutMarkup).toMatch(/canAccessAdmin\(locals\.user\)/);
		expect(layoutMarkup).toMatch(/redirect\(302, "\/dashboard"\)/);
	});
});
