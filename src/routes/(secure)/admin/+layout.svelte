<script module lang="ts">
	export const layoutState = $state({
		pageTitle: "UNSET"
	});
</script>

<script lang="ts">
	import { onNavigate } from "$app/navigation";
	import { page } from "$app/state";

	import DashHeader from "$lib/components/DashHeader.svelte";
	import { adminNavPages } from "$lib/adminNavigation";
	import type { LayoutProps } from "./$types";

	let { children }: LayoutProps = $props();

	onNavigate(() => {
		// Reset page title on navigation
		layoutState.pageTitle = "UNSET";
	});

	const pageTitle = $derived.by(() => {
		if (layoutState.pageTitle === "UNSET") {
			console.log("Page Title Unset", page.url.pathname);
		}
		return layoutState.pageTitle;
	});
</script>

<svelte:head>
	<title>{pageTitle} | Bionic Portal</title>
</svelte:head>

<div class="container">
	<DashHeader pages={adminNavPages} />
</div>
{@render children()}
