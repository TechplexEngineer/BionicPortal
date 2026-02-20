<script lang="ts">
	import TableForObjectArray, {
		type TableColumns
	} from "$lib/components/TableForObjectArray.svelte";
	import { layoutState } from "../+layout.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	const columns: TableColumns = [
		// Userid	FirstName	LastName	Data	Hidden
		{ data: "userid", title: "User ID" },
		{ data: "firstName", title: "First Name" },
		{ data: "lastName", title: "Last Name" },
		{ data: "data", title: "Data" },
		{ data: "hidden", title: "Hidden" },
		{ data: "userid", title: "Actions", renderSnippet: action }
	];

	layoutState.pageTitle = "Student Overview";
</script>

{#snippet action(id: string)}
	<a href={`/admin/students/${id}`} class="btn btn-primary btn-small">Edit</a>
{/snippet}

<div class="container">
	<h1>Student Overview</h1>

	<TableForObjectArray data={data.students} {columns} />
</div>
