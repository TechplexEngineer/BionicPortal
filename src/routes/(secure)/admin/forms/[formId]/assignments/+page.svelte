<script lang="ts">
	import { resolve } from "$app/paths";
	import type { PageProps } from "./$types";
	let { data }: PageProps = $props();
</script>

<svelte:head><title>Assignments | {data.form.name} | Bionic Portal</title></svelte:head>
<div class="container py-4">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<div>
			<h1 class="h2 mb-1">{data.form.name}</h1>
			<p class="text-muted mb-0">Completion status for every visible student</p>
		</div>
		<div class="d-flex gap-2">
			<a class="btn btn-outline-secondary" href={resolve("/admin/forms")}>Back to forms</a><a
				class="btn btn-outline-primary"
				href={resolve(`/admin/forms/${data.form.id}/edit`)}>Edit form</a
			>
		</div>
	</header>
	<div class="card">
		<div class="card-body">
			<h2 class="h5">Student progress</h2>
			{#if data.assignments.length === 0}<p class="text-muted mb-0">No students assigned yet.</p>
			{:else}<div class="list-group list-group-flush">
					{#each data.assignments as assignment (assignment.id)}
						<div
							class="list-group-item px-0 d-flex justify-content-between align-items-center gap-3 flex-wrap"
						>
							<div>
								<div class="fw-semibold">{assignment.studentName}</div>
								<div class="small text-muted">{assignment.studentId}</div>
							</div>
							<div class="d-flex align-items-center gap-2">
								<span
									class="badge {assignment.status === 'complete'
										? 'bg-success'
										: assignment.status === 'parent-pending'
											? 'bg-warning text-dark'
											: 'bg-secondary'}"
									>{assignment.status === "complete"
										? "Submitted"
										: assignment.status === "parent-pending"
											? "Parent pending"
											: "Student incomplete"}</span
								>
								{#if assignment.signedPdfKey}<a
										class="btn btn-outline-primary btn-sm"
										href={resolve(
											`/admin/forms/${data.form.id}/assignments/${assignment.id}/signed`
										)}>Download signed PDF</a
									>{/if}
							</div>
						</div>
					{/each}
				</div>{/if}
		</div>
	</div>
</div>
