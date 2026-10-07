<script lang="ts">
	import { resolve } from "$app/paths";
	import TableForObjectArray, {
		type TableColumns
	} from "$lib/components/TableForObjectArray.svelte";
	import { layoutState } from "../../+layout.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
	type ParentRow = Record<string, any>;

	const columns: TableColumns = [
		{ data: "username", title: "Parent Email", renderSnippet: parentLink },
		{ data: "students", title: "Linked Students", renderSnippet: studentsList }
	];

	layoutState.pageTitle = "Parent Overview";
</script>

{#snippet parentLink(username: string, parent: ParentRow)}
	<a href={resolve(`/admin/users/${parent.id}`)}>{username}</a>
{/snippet}

{#snippet studentsList(students: any[])}
	<div class="d-flex flex-wrap gap-1">
		{#each students as student}
			<a
				href={resolve(`/admin/users/students/${student.studentId}`)}
				class="badge bg-info text-dark text-decoration-none"
				title={`Edit ${student.studentFirstName} ${student.studentLastName}`}
			>
				{student.studentFirstName}
				{student.studentLastName} ({student.studentId})
			</a>
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
