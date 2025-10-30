<script lang="ts">
	import TableForObjectArray, {
		type TableColumns
	} from "$lib/components/TableForObjectArray.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

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
	<h1>Users</h1>
	<TableForObjectArray data={data.users} {columns} />
</div>
