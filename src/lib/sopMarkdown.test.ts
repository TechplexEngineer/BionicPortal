import { describe, expect, it } from "vitest";
import { renderSopMarkdown } from "./sopMarkdown";

describe("renderSopMarkdown", () => {
	it("renders useful markdown and escapes source HTML", () => {
		const html = renderSopMarkdown(
			"# Heading\n\n- **Do this**\n- `carefully`\n\n<script>alert(1)</script>"
		);

		expect(html).toContain("<h1>Heading</h1>");
		expect(html).toContain("<strong>Do this</strong>");
		expect(html).toContain("<code>carefully</code>");
		expect(html).toContain("&lt;script&gt;");
		expect(html).not.toContain("<script>");
	});
});
