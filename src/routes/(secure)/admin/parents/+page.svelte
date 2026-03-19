<script lang="ts">
	import TableForObjectArray, {
		type TableColumns
	} from "$lib/components/TableForObjectArray.svelte";
	import { layoutState } from "../+layout.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	const columns: TableColumns = [
		{ data: "username", title: "Parent Email" },
		{ data: "students", title: "Linked Students", renderSnippet: studentsList }
	];

	layoutState.pageTitle = "Parent Overview";
</script>

{#snippet studentsList(students: any[])}
	<div class="d-flex flex-wrap gap-1">
		{#each students as student}
			<span class="badge bg-info text-dark">
				{student.studentFirstName}
				{student.studentLastName} ({student.studentId})
			</span>
		{:else}
			<span class="text-muted small">No students linked</span>
		{/each}
	</div>
{/snippet}

<div class="container py-4">
	<div class="d-flex justify-content-between align-items-center mb-4">
		<h1>Parent Overview</h1>
	</div>

	<div class="card shadow-sm border-0">
		<div class="card-body p-0">
			<TableForObjectArray data={data.parents} {columns} />
		</div>
	</div>
</div>
