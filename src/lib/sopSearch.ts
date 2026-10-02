import uFuzzy from "@leeoniya/ufuzzy";

export type SearchableSop = { title: string; content: string };

const fuzzy = new uFuzzy();

export function searchSops<T extends SearchableSop>(sops: T[], query: string) {
	const normalizedQuery = query.trim();
	if (!normalizedQuery) return sops;

	const haystack = sops.map((sop) => `${sop.title}\n${sop.content}`);
	const indexes = fuzzy.search(haystack, normalizedQuery)[0];
	return indexes?.map((index) => sops[index]) ?? [];
}
