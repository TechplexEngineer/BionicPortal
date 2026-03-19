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
	<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
		<h1 style="margin: 0;">Users</h1>
		<a href="/admin/users/add" class="btn btn-primary">Add User</a>
	</div>
	<TableForObjectArray data={data.users} {columns} />
</div>
