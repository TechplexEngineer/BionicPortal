<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Forms | {data.event.name} | Bionic Portal</title></svelte:head>

<div class="container py-4">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<div>
			<h1 class="h2 mb-1">Forms for {data.event.name}</h1>
			<p class="text-muted mb-0">Manage reusable event forms.</p>
		</div>
		<div class="d-flex gap-2">
			<a
				class="btn btn-outline-secondary"
				href={resolve(`/admin/events/${data.event.id}/registrations`)}>Registrations</a
			>
			<a class="btn btn-primary" href={resolve(`/admin/events/${data.event.id}/forms/new`)}
				>Create New Form</a
			>
		</div>
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
			{#if data.sourceEvents.some((sourceEvent) => sourceEvent.forms?.length)}
				<form method="post" action="?/copy" use:enhance class="row g-2 align-items-end mb-4">
					<div class="col-md-8">
						<label class="form-label" for="source-form">Copy a form from another event</label>
						<select id="source-form" name="sourceFormId" class="form-select" required>
							<option value="">Choose a form…</option>
							{#each data.sourceEvents as sourceEvent (sourceEvent.id)}
								{#if sourceEvent.forms?.length}
									<optgroup label={sourceEvent.name}>
										{#each sourceEvent.forms as sourceForm (sourceForm.id)}
											<option value={sourceForm.id}>{sourceForm.name}</option>
										{/each}
									</optgroup>
								{/if}
							{/each}
						</select>
					</div>
					<div class="col-md-auto">
						<button class="btn btn-outline-primary" type="submit">Copy form</button>
					</div>
				</form>
			{/if}
			{#if data.forms.length === 0}
				<p class="text-muted mb-0">No forms added yet.</p>
			{:else}
				<div class="list-group list-group-flush">
					{#each data.forms as savedForm (savedForm.id)}
						<div class="list-group-item px-0">
							<div class="d-flex justify-content-between align-items-center">
								<div>
									<div class="fw-semibold">{savedForm.name}</div>
									<div class="text-muted small">
										{(savedForm.definition as { fields: unknown[] }).fields.length} fields
									</div>
								</div>
								<div class="d-flex gap-2">
									<a
										class="btn btn-outline-secondary btn-sm"
										href={resolve(`/admin/events/${data.event.id}/forms/${savedForm.id}/base`)}
										>View</a
									>
									<a
										class="btn btn-outline-primary btn-sm"
										href={resolve(`/admin/events/${data.event.id}/forms/${savedForm.id}/edit`)}
										>Edit</a
									>
									<a
										class="btn btn-outline-danger btn-sm"
										href={resolve(
											`/admin/events/${data.event.id}/forms?delete=${encodeURIComponent(savedForm.id)}`
										)}>Delete</a
									>
								</div>
							</div>
							{#if data.deleteFormId === savedForm.id}
								<div class="alert alert-warning mt-3 mb-0">
									<p class="mb-2">Delete {savedForm.name}? This cannot be undone.</p>
									<form method="post" action="?/delete" class="d-flex gap-2">
										<input type="hidden" name="formId" value={savedForm.id} />
										<button class="btn btn-danger btn-sm" type="submit">Confirm delete</button>
										<a
											class="btn btn-outline-secondary btn-sm"
											href={resolve(`/admin/events/${data.event.id}/forms`)}>Cancel</a
										>
									</form>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
