<script lang="ts">
	import "@team4909/bionic-sign/styles.css";
	import { PdfFormFiller, type FormSubmission } from "@team4909/bionic-sign";
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";
	let { data, form }: PageProps = $props();
	let filler = $state<{ submit: () => Promise<FormSubmission> }>();
	let values = $state("{}");
	let submitting = $state(false);
	async function sign() {
		if (!filler) return;
		submitting = true;
		try {
			values = JSON.stringify((await filler.submit()).values);
			(document.getElementById("parent-submit") as HTMLFormElement).requestSubmit();
		} catch {
			submitting = false;
		}
	}
</script>

<svelte:head><title>Parent Signature | {data.event.name}</title></svelte:head>
<div class="container py-4" style="max-width: 1100px;">
	<a href="/dashboard/parent">← Parent Dashboard</a>
	<h1 class="h2 mt-3 mb-1">Complete a parent event form</h1>
	<p class="text-muted">{data.student.firstName} {data.student.lastName} · {data.event.name}</p>
	{#if form?.success}
		<div class="alert alert-success" role="status">
			<strong>Form submitted.</strong> Your parent information and signature were saved. You can return
			to the dashboard to see whether any other forms need your attention.
		</div>
		<a class="btn btn-primary" href="/dashboard/parent">Return to parent dashboard</a>
	{:else}
		<div class="alert alert-info" role="note">
			<strong>Before you submit:</strong> Review the form, complete every field marked as required,
			and then select <strong>Sign and submit</strong> at the bottom. Your student has already completed
			their part of this form.
		</div>
		{#if form?.message}<div class="alert alert-danger" role="alert">{form.message}</div>{/if}
		<div class="bionic-sign">
			<PdfFormFiller
				bind:this={filler}
				source="/dashboard/parent/forms/{data.inviteId}/base"
				definition={data.definition}
			/>
		</div>
		<form
			id="parent-submit"
			method="post"
			action="?/submit"
			use:enhance={() =>
				({ update }) => {
					update().finally(() => (submitting = false));
				}}
		>
			<input type="hidden" name="values" value={values} />
			<button type="button" class="btn btn-primary mt-3" onclick={sign} disabled={submitting}
				>{submitting ? "Saving…" : "Sign and submit"}</button
			>
		</form>
	{/if}
</div>
