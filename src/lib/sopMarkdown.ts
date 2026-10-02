function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function renderInline(value: string) {
	let rendered = escapeHtml(value);
	rendered = rendered.replace(/`([^`]+)`/g, "<code>$1</code>");
	rendered = rendered.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
	rendered = rendered.replace(/\*([^*]+)\*/g, "<em>$1</em>");
	rendered = rendered.replace(
		/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
		'<a href="$2" target="_blank" rel="noreferrer">$1</a>'
	);
	return rendered;
}

/** Render the supported SOP markdown subset after escaping all source HTML. */
export function renderSopMarkdown(markdown: string) {
	const lines = markdown.replaceAll("\r\n", "\n").split("\n");
	const html: string[] = [];
	let paragraph: string[] = [];
	let listItems: string[] = [];

	const flushParagraph = () => {
		if (paragraph.length > 0) {
			html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
			paragraph = [];
		}
	};
	const flushList = () => {
		if (listItems.length > 0) {
			html.push(`<ul>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
			listItems = [];
		}
	};

	for (const line of lines) {
		const heading = line.match(/^(#{1,3})\s+(.+)$/);
		const listItem = line.match(/^[-*]\s+(.+)$/);
		if (heading) {
			flushParagraph();
			flushList();
			const level = heading[1].length;
			html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
		} else if (listItem) {
			flushParagraph();
			listItems.push(listItem[1]);
		} else if (!line.trim()) {
			flushParagraph();
			flushList();
		} else {
			flushList();
			paragraph.push(line);
		}
	}
	flushParagraph();
	flushList();
	return html.join("\n");
}
