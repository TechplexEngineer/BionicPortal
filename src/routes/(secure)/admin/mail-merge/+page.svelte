<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();

	const BLOG_TEMPLATE_SUBJECT = "Team 4909 Weekly Blog Post";
	const BLOG_TEMPLATE_BODY = `Hello Everyone,

Please follow the link below to check out our post!

https://www.team4909.org/blog

As always, thank you for your support!`;

	let subject = $state("");
	let body = $state("");
	let selectedGroups = $state<string[]>([]);

	const parentCount = data.contacts.filter((c) => c.type === "parent").length;
	const sponsorCount = data.contacts.filter((c) => c.type === "sponsor").length;
	const mentorCount = data.contacts.filter((c) => c.type === "mentor").length;

	const recipientCount = $derived(
		(selectedGroups.includes("students") ? data.students.length : 0) +
			(selectedGroups.includes("parent") ? parentCount : 0) +
			(selectedGroups.includes("sponsor") ? sponsorCount : 0) +
			(selectedGroups.includes("mentor") ? mentorCount : 0)
	);

	function useTemplate() {
		subject = BLOG_TEMPLATE_SUBJECT;
		body = BLOG_TEMPLATE_BODY;
	}

	function toggleGroup(group: string) {
		if (selectedGroups.includes(group)) {
			selectedGroups = selectedGroups.filter((g) => g !== group);
		} else {
			selectedGroups = [...selectedGroups, group];
		}
	}
</script>

<svelte:head>
	<title>Mail Merge | Admin</title>
</svelte:head>

<div class="container">
	<h1>Mail Merge</h1>
	<p class="text-muted">Compose and send emails to students, parents, sponsors, and mentors.</p>

	{#if form?.error}
		<div class="alert alert-danger" role="alert">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="alert alert-success" role="alert">{form.message}</div>
		{#if form.errors && form.errors.length > 0}
			<div class="alert alert-warning" role="alert">
				Failed to send to: {form.errors.join(", ")}
			</div>
		{/if}
	{/if}

	<form method="post" action="?/send" use:enhance>
		<div class="card mt-3">
			<div class="card-header">Recipients</div>
			<div class="card-body">
				<div class="row g-3">
					<div class="col-auto">
						<div class="form-check">
							<input
								class="form-check-input"
								type="checkbox"
								id="group-students"
								name="groups"
								value="students"
								checked={selectedGroups.includes("students")}
								onchange={() => toggleGroup("students")}
							/>
							<label class="form-check-label" for="group-students">
								Students <span class="badge bg-secondary">{data.students.length}</span>
							</label>
						</div>
					</div>
					<div class="col-auto">
						<div class="form-check">
							<input
								class="form-check-input"
								type="checkbox"
								id="group-parent"
								name="groups"
								value="parent"
								checked={selectedGroups.includes("parent")}
								onchange={() => toggleGroup("parent")}
							/>
							<label class="form-check-label" for="group-parent">
								Parents <span class="badge bg-secondary">{parentCount}</span>
							</label>
						</div>
					</div>
					<div class="col-auto">
						<div class="form-check">
							<input
								class="form-check-input"
								type="checkbox"
								id="group-sponsor"
								name="groups"
								value="sponsor"
								checked={selectedGroups.includes("sponsor")}
								onchange={() => toggleGroup("sponsor")}
							/>
							<label class="form-check-label" for="group-sponsor">
								Sponsors <span class="badge bg-secondary">{sponsorCount}</span>
							</label>
						</div>
					</div>
					<div class="col-auto">
						<div class="form-check">
							<input
								class="form-check-input"
								type="checkbox"
								id="group-mentor"
								name="groups"
								value="mentor"
								checked={selectedGroups.includes("mentor")}
								onchange={() => toggleGroup("mentor")}
							/>
							<label class="form-check-label" for="group-mentor">
								Mentors <span class="badge bg-secondary">{mentorCount}</span>
							</label>
						</div>
					</div>
				</div>
				<p class="mt-2 text-muted mb-0">
					Estimated recipients: <strong>{recipientCount}</strong>
				</p>
			</div>
		</div>

		<div class="card mt-3">
			<div class="card-header d-flex justify-content-between align-items-center">
				<span>Compose</span>
				<button type="button" class="btn btn-outline-secondary btn-sm" onclick={useTemplate}>
					Use Blog Post Template
				</button>
			</div>
			<div class="card-body">
				<div class="mb-3">
					<label for="subject" class="form-label">Subject</label>
					<input
						type="text"
						class="form-control"
						id="subject"
						name="subject"
						bind:value={subject}
						required
					/>
				</div>
				<div class="mb-3">
					<label for="body" class="form-label">Body</label>
					<textarea class="form-control" id="body" name="body" rows="10" bind:value={body} required
					></textarea>
				</div>
			</div>
		</div>

		<div class="mt-3">
			<button type="submit" class="btn btn-primary">Send Emails</button>
		</div>
	</form>
</div>
