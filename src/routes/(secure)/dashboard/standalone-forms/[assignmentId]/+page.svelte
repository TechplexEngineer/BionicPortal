<script lang="ts">
	import "@team4909/bionic-sign/styles.css";
	import { PdfFormFiller, type FormDefinition, type FormSubmission } from "@team4909/bionic-sign";
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import { tick } from "svelte";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
	let filler = $state<{ submit: () => Promise<FormSubmission> }>();
	let values = $state("{}");
	let pending = $state(false);
	let uploading = $state(false);
	let errorMessage = $state("");
	let action = $state<"saveDraft" | "submit">("saveDraft");
	const studentDefinition: FormDefinition = {
		version: 1,
		fields: (data.definition as FormDefinition).fields.map((field) => ({
			...field,
			required: false
		}))
	};
	const studentPrefill = Object.fromEntries(
		Object.entries(data.studentValues as Record<string, { type: string; value?: string }>)
			.filter(([, value]) => value.type === "text" && typeof value.value === "string")
			.map(([name, value]) => [name, value.value as string])
	);

	async function save(nextAction: "saveDraft" | "submit") {
		if (!filler) return;
		pending = true;
		errorMessage = "";
		try {
			values = JSON.stringify((await filler.submit()).values);
			action = nextAction;
			await tick();
			(document.getElementById("standalone-student-form") as HTMLFormElement).requestSubmit();
		} catch (caught) {
			errorMessage = caught instanceof Error ? caught.message : "Unable to read form fields.";
			pending = false;
		}
	}
</script>

<svelte:head><title>{data.form.name} | Bionic Portal</title></svelte:head>
<div class="container py-4" style="max-width: 1100px;">
	<a href={resolve("/dashboard")} class="text-decoration-none">← Dashboard</a>
	<h1 class="h2 mt-3">{data.form.name}</h1>
	{#if data.studentSubmitted}
		<div
			class="alert {data.parentRequired && !data.parentCompleted
				? 'alert-warning'
				: 'alert-success'}"
			role="status"
		>
			{data.parentRequired && !data.parentCompleted
				? "Your portion was submitted. A parent still needs to complete this form."
				: "Form submitted."}
		</div>
	{:else}
		<p class="text-muted">Complete your fields and submit this assigned form.</p>
		{#if data.parentRequired}<div class="alert alert-info">
				A parent will complete their fields after you submit your portion.
			</div>{/if}
		{#if form?.message}<div
				class="alert {form?.success ? 'alert-info' : 'alert-danger'}"
				role="status"
			>
				{form.message}
			</div>{/if}
		{#if errorMessage}<div class="alert alert-danger" role="alert">{errorMessage}</div>{/if}
		<div class="bionic-sign">
			<PdfFormFiller
				bind:this={filler}
				source="/dashboard/standalone-forms/{data.assignmentId}/base"
				definition={studentDefinition}
				prefill={studentPrefill}
			/>
		</div>
		<form
			id="standalone-student-form"
			method="post"
			action="?/{action}"
			use:enhance={() =>
				({ update }) => {
					update({ reset: false }).finally(() => (pending = false));
				}}
		>
			<input type="hidden" name="values" value={values} />
			<div class="d-flex gap-2 mt-3">
				<button
					type="button"
					class="btn btn-outline-primary"
					onclick={() => save("saveDraft")}
					disabled={pending}>Save draft</button
				>
				<button
					type="button"
					class="btn btn-primary"
					onclick={() => save("submit")}
					disabled={pending}>Submit form</button
				>
			</div>
		</form>
		{#if !data.studentSubmitted}
			<div class="card mt-4">
				<div class="card-body">
					<h2 class="h5">Upload a completed form</h2>
					<p class="text-muted mb-3">
						If you already have a signed paper copy, upload a PDF or photo instead. This will submit
						the form as-is and skip the parent-signature step for now.
					</p>
					<form
						method="post"
						action="?/upload"
						enctype="multipart/form-data"
						use:enhance={() =>
							({ update }) =>
								update().finally(() => (uploading = false))}
						onsubmit={() => (uploading = true)}
					>
						<label class="form-label" for="standalone-student-upload"
							>PDF, JPEG, PNG, or WebP (max 10 MB)</label
						>
						<input
							id="standalone-student-upload"
							class="form-control"
							type="file"
							name="upload"
							accept="application/pdf,image/jpeg,image/png,image/webp"
							required
						/>
						<button class="btn btn-outline-primary mt-3" type="submit" disabled={uploading}>
							{uploading ? "Uploading…" : "Upload and submit"}
						</button>
					</form>
				</div>
			</div>
		{/if}
	{/if}
</div>
