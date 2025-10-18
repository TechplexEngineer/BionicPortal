<script module>
	export interface Page {
		name: String;
		route: string;
		nested: Subpage[];
	}

	export interface Subpage {
		name: string;
		route: string;
	}
</script>

<script lang="ts">
	import { page } from "$app/state";
	import {
		isActiveParentRoute as utils_isActiveParentRoute,
		getParentRoute as utils_getParentRoute
	} from "./utils";

	type PageProps = {
		pages: Page[];
	};
	const { pages }: PageProps = $props();

	const isActiveParentRoute = (route: string) => {
		// check all the parent routes, find the longest matching prefix
		return utils_isActiveParentRoute(route, page.url.pathname, pages) ? "active" : "";
	};

	const isActiveRoute = (route: string) => {
		const currentRoute = page.url.pathname;
		return currentRoute === route ? "active" : "";
	};

	const subpages = $derived.by(() => {
		const parentRoute = utils_getParentRoute(page.url.pathname, pages);
		const parentPage = pages.find((pg) => pg.route === parentRoute);
		return parentPage?.nested || [];
	});
	// (
	// 	(pages || []).find((pg) => pg.route === page.url.pathname)?.nested || []
	// );

	const pathFor = (route: string) => {
		return route;
	};
</script>

<div class="adminnav">
	<ul class="nav nav-tabs prinav">
		{#each pages as page}
			<li class="nav-item {isActiveParentRoute(page.route)}" title="">
				<a class="nav-link" href={pathFor(page.route)} data-name={page.route}>{page.name}</a>
			</li>
		{/each}
	</ul>

	<ul class="nav nav-pills subnav">
		{#each subpages as subpage}
			<li class="nav-item {isActiveRoute(subpage.route)}" title="">
				<a class="nav-link" href={pathFor(subpage.route)} data-name={subpage.route}
					>{subpage.name}</a
				>
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	$deep-blue: #3376a4;
	$light-blue: #4b89b2;
	$light-grey: #e6e6e6;

	.prinav {
		background-color: $deep-blue;
		padding: 5px 5px 0 5px;
		border-radius: 5px 5px 0 0;

		li > a {
			background-color: $light-blue;
			color: white;
			border-bottom: 0px solid transparent;
			margin-right: 5px;
			&:hover,
			&:focus {
				color: black;
				border-color: $light-blue;
				background-color: darken($light-grey, 5%);
			}
		}

		li.active > a {
			background-color: $light-grey;
			border: 1px solid #ddd;
			border-bottom-color: transparent;
			cursor: default; //when the tab is active, not clickable
			color: black;
			&:hover,
			&:focus {
				background-color: $light-grey;
			}
		}
	}

	.subnav {
		background-color: $light-grey;
		padding: 5px;
		border-radius: 0 0 5px 5px;

		li > a {
			margin-right: 5px;
			color: #555;
			&:hover {
				background-color: darken($light-blue, 10%);
				color: white;
			}
		}
		li.active > a {
			background-color: $light-blue;
			color: white;
			&:hover {
				background-color: $light-blue;
				cursor: default;
			}
		}
	}
</style>
