<script lang="ts">
	import TableForObjectArray, {
		type TableColumns
	} from "$lib/components/TableForObjectArray.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	const columns: TableColumns = [
		{ data: "name", title: "Name" },
		{ data: "level", title: "Level" },
		{ data: "emails", title: "Emails" },
		{ data: "id", title: "Actions", renderSnippet: action }
	];
</script>

{#snippet action(id: string)}
	<a href={`/admin/sponsors/${id}`} class="btn btn-primary btn-small">Edit</a>
{/snippet}

<div class="container">
	<div class="d-flex justify-content-between align-items-center mt-4 mb-3">
		<h1>Sponsors</h1>
		<a href="/admin/sponsors/new" class="btn btn-success">+ Add Sponsor</a>
	</div>

	<TableForObjectArray data={data.sponsors} {columns} />
</div>
