<script lang="ts">
	import "@team4909/bionic-sign/styles.css";
	import { PdfFormFiller, type FormSubmission } from "@team4909/bionic-sign";
	import { enhance } from "$app/forms";
	import { tick } from "svelte";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
	let filler = $state<{ submit: () => Promise<FormSubmission> }>();
	let values = $state("{}");
	let submitting = $state(false);
	let errorMessage = $state("");

	async function sign() {
		if (!filler) return;
		submitting = true;
		errorMessage = "";
		try {
			values = JSON.stringify((await filler.submit()).values);
			await tick();
			(document.getElementById("parent-standalone-submit") as HTMLFormElement).requestSubmit();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : "Please complete the parent fields.";
			submitting = false;
		}
	}
</script>

<svelte:head><title>Parent Signature | {data.form.name} | Bionic Portal</title></svelte:head>
<div class="container py-4" style="max-width: 1100px;">
	<a href="/dashboard/parent">← Parent Dashboard</a>
	<h1 class="h2 mt-3 mb-1">{data.form.name}</h1>
	<p class="text-muted">For {data.student.firstName} {data.student.lastName}</p>
	{#if data.completed || form?.success}
		<div class="alert alert-success" role="status">Form submitted.</div>
		<a class="btn btn-primary" href="/dashboard/parent">Return to parent dashboard</a>
	{:else}
		<div class="alert alert-info" role="note">
			Review the student's information, complete the required parent fields, then sign and submit.
		</div>
		{#if form?.message}<div class="alert alert-danger" role="alert">{form.message}</div>{/if}
		{#if errorMessage}<div class="alert alert-danger" role="alert">{errorMessage}</div>{/if}
		<div class="bionic-sign">
			<PdfFormFiller
				bind:this={filler}
				source="/dashboard/parent/standalone-forms/{data.assignmentId}/base"
				definition={data.definition}
			/>
		</div>
		<form
			id="parent-standalone-submit"
			method="post"
			action="?/submit"
			use:enhance={() =>
				({ update }) => {
					update().finally(() => (submitting = false));
				}}
		>
			<input type="hidden" name="values" value={values} />
			<button class="btn btn-primary mt-3" type="button" onclick={sign} disabled={submitting}>
				{submitting ? "Saving…" : "Sign and submit"}
			</button>
		</form>
	{/if}
</div>
