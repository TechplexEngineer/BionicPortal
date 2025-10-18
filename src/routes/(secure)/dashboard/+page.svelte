<script lang="ts">
	import { enhance } from "$app/forms";
	import DashHeader, { type Page } from "$lib/components/DashHeader.svelte";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();

	let navPages: Page[] = [
		{
			name: "Dashboard",
			route: "/dashboard",
			nested: [
				{
					name: "Overview",
					route: "/dashboard"
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Dashboard | Bionic Portal</title>
</svelte:head>

<div class="container">
	<DashHeader pages={navPages} />
</div>
