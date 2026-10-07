<script lang="ts">
	import "@team4909/bionic-sign/styles.css";
	import { PdfFormDesigner, type FormDefinition } from "@team4909/bionic-sign";
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { PageProps } from "./$types";
	let { data, form }: PageProps = $props();
	let name = $state(data.form.name);
	let definition = $state(data.form.definition as FormDefinition);
	let saving = $state(false);
</script>

<svelte:head><title>Edit {data.form.name} | Bionic Portal</title></svelte:head>
<div class="container-fluid px-4 py-4">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<div>
			<h1 class="h2 mb-1">Edit {data.form.name}</h1>
			<p class="text-muted mb-0">
				Configure fields for this standalone form. Prefix parent fields with <code>parent_</code>.
			</p>
		</div>
		<div class="d-flex gap-2">
			<a class="btn btn-outline-secondary" href={resolve("/admin/forms")}>Back to forms</a><a
				class="btn btn-outline-primary"
				href={resolve(`/admin/forms/${data.form.id}/assignments`)}>Assignments</a
			>
		</div>
	</header>
	{#if form?.message}<div class="alert alert-danger" role="alert">{form.message}</div>{/if}
	{#if data.hasAssignments}
		<div class="alert alert-info" role="note">This form has assigned students. Its fields are locked, but you can rename it.</div>
	{:else}
		<div class="alert alert-info" role="note">Name parent fields with a <code>parent_</code> prefix and mark at least one parent field required to request parent completion. Optional parent fields alone will not trigger a parent request.</div>
	{/if}
	<div class="mb-3">
		<label class="form-label" for="form-name">Form name</label><input
			id="form-name"
			bind:value={name}
			class="form-control"
		/>
	</div>
	{#if !data.hasAssignments}
		<div class="w-100">
			<PdfFormDesigner
				source={`/admin/forms/${data.form.id}/base`}
				{definition}
				ondefinitionchange={(next) => (definition = next)}
			/>
		</div>
	{/if}
	<form
		method="post"
		action="?/save"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update();
				saving = false;
			};
		}}
	>
		<input type="hidden" name="name" value={name} /><input
			type="hidden"
			name="definition"
			value={JSON.stringify(definition)}
		/>
		<button class="btn btn-primary mt-3" type="submit" disabled={saving}
			>{saving ? "Saving…" : "Save form"}</button
		>
	</form>
</div>
