<script module lang="ts">
	export const layoutState = $state({
		pageTitle: "UNSET"
	});
</script>

<script lang="ts">
	import { onNavigate } from "$app/navigation";
	import { page } from "$app/state";

	import DashHeader, { type Page } from "$lib/components/DashHeader.svelte";
	import type { LayoutProps } from "./$types";

	let { data, children }: LayoutProps = $props();

	const navPages: Page[] = [
		{
			name: "Dashboard",
			route: "/admin",
			nested: [
				{
					name: "Overview",
					route: "/admin"
				}
			]
		},
		{
			name: "Students",
			route: "/admin/students",
			nested: [
				{
					name: "Overview",
					route: "/admin/students"
				},
				{
					name: "Import",
					route: "/admin/students/import"
				},
				{
					name: "Attendance",
					route: "/admin/students/attendance"
				}
			]
		},
		{
			name: "Users",
			route: "/admin/users",
			nested: [
				{
					name: "Overview",
					route: "/admin/users"
				}
			]
		},
		{
			name: "Events",
			route: "/admin/events",
			nested: [
				{
					name: "Overview",
					route: "/admin/events"
				},
				{
					name: "Add Event",
					route: "/admin/events/add"
				},
				{
					name: "Import Events",
					route: "/admin/events/import"
				},
				{
					name: "Carpools",
					route: "/admin/events/carpools"
				}
			]
		}
	];

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
	<DashHeader pages={navPages} />
</div>
{@render children()}
