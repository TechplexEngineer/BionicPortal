<script lang="ts">
	import type { TableColumns } from "$lib/components/TableForObjectArray.svelte";
	import TableForObjectArray from "$lib/components/TableForObjectArray.svelte";
	//
	import { layoutState } from "../+layout.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	layoutState.pageTitle = "Events";

	// const eventData: EventData = {};

	// console.log(eventInsertSchema);

	const columns: TableColumns = [
		// { data: "id", title: "ID" },
		{ data: "username", title: "Username" },
		{ data: "role", title: "Role" },
		{ data: "id", title: "Actions", renderSnippet: action }
	];
</script>

{#snippet action(id: string)}
	<a href={`/admin/users/${id}`} class="btn btn-primary btn-small">Edit</a>
{/snippet}

<div class="container">
	<h1>{layoutState.pageTitle}</h1>
	<TableForObjectArray data={data.events} {columns} />
</div>
