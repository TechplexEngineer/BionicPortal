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
	<a href={`/admin/users/${id}`} class="btn btn-primary btn-sm me-1">Edit</a>
	<form method="POST" action="?/delete" style="display:inline;">
		<input type="hidden" name="id" value={id} />
		<button
			type="submit"
			class="btn btn-danger btn-sm"
			onclick={(e) => {
				if (!confirm("Are you sure you want to delete this user?")) e.preventDefault();
			}}>Delete</button
		>
	</form>
{/snippet}

<div class="container">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1>Users</h1>
		<a href="/admin/users/new" class="btn btn-success">Create User</a>
	</div>
	<TableForObjectArray data={data.users} {columns} />
</div>
