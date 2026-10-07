<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { PageProps } from "./$types";
	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Assignments | {data.form.name} | Bionic Portal</title></svelte:head>
<div class="container py-4">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<div>
			<h1 class="h2 mb-1">{data.form.name}</h1>
			<p class="text-muted mb-0">Student assignments and submitted forms</p>
		</div>
		<div class="d-flex gap-2">
			<a class="btn btn-outline-secondary" href={resolve("/admin/forms")}>Back to forms</a><a
				class="btn btn-outline-primary"
				href={resolve(`/admin/forms/${data.form.id}/edit`)}>Edit form</a
			>
		</div>
	</header>
	{#if form?.message}<div
			class="alert {form.success ? 'alert-success' : 'alert-danger'}"
			role="alert"
		>
			{form.message}
		</div>{/if}
	<div class="card mb-4">
		<div class="card-body">
			<h2 class="h5">Assign to a student</h2>
			{#if data.availableStudents.length}
				<form method="post" action="?/assign" use:enhance class="row g-2 align-items-end">
					<div class="col-md-8">
						<label class="form-label" for="student">Student</label><select
							class="form-select"
							id="student"
							name="studentId"
							required
							><option value="">Choose a student…</option
							>{#each data.availableStudents as student}<option value={student.id}
									>{student.name} ({student.id})</option
								>{/each}</select
						>
					</div>
					<div class="col-md-auto">
						<button class="btn btn-primary" type="submit">Assign form</button>
					</div>
				</form>
			{:else}<p class="text-muted mb-0">All visible students have this form assigned.</p>{/if}
		</div>
	</div>
	<div class="card">
		<div class="card-body">
			<h2 class="h5">Assigned students</h2>
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
								{#if !assignment.studentSubmittedAt}<form
										method="post"
										action="?/unassign"
										use:enhance
									>
										<input type="hidden" name="assignmentId" value={assignment.id} /><button
											class="btn btn-outline-danger btn-sm"
											type="submit">Unassign</button
										>
									</form>{/if}
							</div>
						</div>
					{/each}
				</div>{/if}
		</div>
	</div>
</div>
