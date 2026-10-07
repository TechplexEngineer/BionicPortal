<script lang="ts">
	import "@team4909/bionic-sign/styles.css";
	import { PdfFormFiller, type FormDefinition, type FormSubmission } from "@team4909/bionic-sign";
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
	let filler = $state<{ submit: () => Promise<FormSubmission> }>();
	let values = $state(JSON.stringify(data.studentValues ?? {}));
	let submitting = $state(false);
	let uploading = $state(false);
	let errorMessage = $state("");
	const studentDefinition: FormDefinition = {
		version: 1,
		fields: (data.definition as FormDefinition).fields.filter(
			(field) => !field.name.startsWith("parent_")
		)
	};
	const studentPrefill = Object.fromEntries(
		Object.entries(data.studentValues as Record<string, { type: string; value?: string }>)
			.filter(([, value]) => value.type === "text" && typeof value.value === "string")
			.map(([name, value]) => [name, value.value as string])
	);

	async function saveDraft() {
		if (!filler) return;
		submitting = true;
		errorMessage = "";
		try {
			const submission = await filler.submit();
			values = JSON.stringify(submission.values);
			(document.getElementById("student-draft") as HTMLFormElement).requestSubmit();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : "Please complete the student fields.";
			submitting = false;
		}
	}
</script>

<svelte:head><title>{data.form.name} | {data.event.name} | Bionic Portal</title></svelte:head>
<div class="container py-4" style="max-width: 1100px;">
	<header class="mb-4">
		<a href={resolve("/dashboard")} class="text-decoration-none">← Dashboard</a>
		<h1 class="h2 mt-3">{data.form.name}</h1>
		<p class="text-muted">{data.event.name} · Complete your part of this form.</p>
	</header>
	{#if form?.message}<div class="alert alert-info">{form.message}</div>{/if}
	{#if errorMessage}<div class="alert alert-danger" role="alert">{errorMessage}</div>{/if}
	<div class="alert alert-secondary">
		Parent fields and signatures will be completed from the parent dashboard.
	</div>
	{#if data.uploaded}
		<div class="alert alert-success" role="status">
			Your uploaded form was submitted successfully.
		</div>
	{:else}
		<div class="bionic-sign">
			<PdfFormFiller
				bind:this={filler}
				source="/dashboard/forms/{data.registrationId}/{data.formId}/base"
				definition={studentDefinition}
				prefill={studentPrefill}
			/>
		</div>
		<form
			id="student-draft"
			method="post"
			action="?/saveDraft"
			use:enhance={() =>
				({ update }) => {
					update().finally(() => (submitting = false));
				}}
		>
			<input type="hidden" name="values" value={values} />
			<button class="btn btn-primary mt-3" type="button" onclick={saveDraft} disabled={submitting}>
				{submitting ? "Saving…" : "Save student portion"}
			</button>
		</form>
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
					<label class="form-label" for="student-upload">PDF, JPEG, PNG, or WebP (max 10 MB)</label>
					<input
						id="student-upload"
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
	{#if !data.uploaded && (data.status === "parent-pending" || data.parentEmails.length > 0)}
		<form method="post" action="?/sendParent" use:enhance class="card mt-4 border-0 shadow-sm">
			<div class="card-body">
				<h2 class="h5">Send to a parent for signature</h2>
				<p class="text-muted">
					Your parent will receive a link and be connected to your account automatically.
				</p>
				<div class="input-group">
					<select class="form-select" name="parentEmail" required>
						<option value="">Select parent email</option>
						{#each data.parentEmails as email (email)}<option value={email}>{email}</option>{/each}
					</select>
					<button class="btn btn-outline-primary" type="submit">Send invitation</button>
				</div>
			</div>
		</form>
	{/if}
</div>
