<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { PageProps } from "./$types";
	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Standalone Forms | Bionic Portal</title></svelte:head>

<div class="container py-4">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<div>
			<h1 class="h2 mb-1">Standalone forms</h1>
			<p class="text-muted mb-0">Publish forms for every student independently of events.</p>
		</div>
		<a class="btn btn-primary" href={resolve("/admin/forms/new")}>Create form</a>
	</header>
	{#if form?.message}
		<div
			class="alert {form.warning
				? 'alert-warning'
				: form.success
					? 'alert-success'
					: 'alert-danger'}"
			role="alert"
		>
			{form.message}
		</div>
	{/if}
	<div class="card">
		<div class="card-body">
			<h2 class="h5">Saved forms</h2>
			{#if data.forms.length === 0}
				<p class="text-muted mb-0">No standalone forms yet.</p>
			{:else}
				<div class="list-group list-group-flush">
					{#each data.forms as savedForm (savedForm.id)}
						<div
							class="list-group-item px-0 d-flex justify-content-between align-items-center gap-3 flex-wrap"
						>
							<div>
								<div class="fw-semibold">{savedForm.name}</div>
								<div class="text-muted small">
									{savedForm.studentCount} student records · {(
										savedForm.definition as { fields: unknown[] }
									).fields.length} fields
								</div>
							</div>
							<div class="d-flex gap-2 flex-wrap">
								<a
									class="btn btn-outline-secondary btn-sm"
									href={resolve(`/admin/forms/${savedForm.id}/base`)}>View PDF</a
								>
								<a
									class="btn btn-outline-primary btn-sm"
									href={resolve(`/admin/forms/${savedForm.id}/edit`)}>Edit</a
								>
								<span
									class="badge {savedForm.status === 'assigned' ? 'bg-success' : 'bg-secondary'}"
								>
									{savedForm.status === "assigned" ? "Assigned to all students" : "Draft"}
								</span>
								<a
									class="btn btn-outline-primary btn-sm"
									href={resolve(`/admin/forms/${savedForm.id}/assignments`)}>View progress</a
								>
								<form method="post" action="?/toggleStatus" use:enhance>
									<input type="hidden" name="formId" value={savedForm.id} />
									<input
										type="hidden"
										name="status"
										value={savedForm.status === "assigned" ? "draft" : "assigned"}
									/>
									<button class="btn btn-primary btn-sm" type="submit">
										{savedForm.status === "assigned" ? "Return to draft" : "Assign to all students"}
									</button>
								</form>
								{#if savedForm.studentCount === 0}
									<form
										method="post"
										action="?/delete"
										use:enhance={({ cancel }) => {
											if (!confirm(`Delete ${savedForm.name}?`)) {
												cancel();
												return;
											}
										}}
									>
										<input type="hidden" name="formId" value={savedForm.id} />
										<button class="btn btn-outline-danger btn-sm" type="submit">Delete</button>
									</form>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
