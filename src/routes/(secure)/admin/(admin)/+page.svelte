<script lang="ts">
	import { enhance } from "$app/forms";
	import { layoutState } from "../+layout.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	layoutState.pageTitle = "Admin Dashboard";
</script>

<div class="container">
	<h1>{layoutState.pageTitle}</h1>
</div>
