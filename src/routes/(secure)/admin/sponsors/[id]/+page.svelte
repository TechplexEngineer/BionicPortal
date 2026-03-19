<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();

	function parseEmails(raw: string | null): string {
		try {
			const parsed = JSON.parse(raw ?? "[]");
			return Array.isArray(parsed) ? parsed.join("\n") : "";
		} catch {
			return "";
		}
	}

	const emailsDisplay = $derived(parseEmails(data.sponsor.emails));
</script>

<div class="container">
	<h1 class="mt-4">Edit Sponsor <small class="text-muted">{data.sponsor.name}</small></h1>

	{#if form?.message}
		<div class="alert alert-danger" role="alert">{form.message}</div>
	{/if}

	<div class="card mt-3">
		<div class="card-body">
			<form method="post" action="?/update" enctype="multipart/form-data" use:enhance>
				<div class="mb-3">
					<label for="name" class="form-label"
						>Sponsor Name <span class="text-danger">*</span></label
					>
					<input
						class="form-control"
						type="text"
						id="name"
						name="name"
						required
						value={data.sponsor.name}
					/>
				</div>

				<div class="mb-3">
					<label for="level" class="form-label"
						>Sponsorship Level <span class="text-danger">*</span></label
					>
					<input
						class="form-control"
						type="text"
						id="level"
						name="level"
						required
						value={data.sponsor.level}
					/>
				</div>

				<div class="mb-3">
					<label for="emails" class="form-label">Emails <span class="text-danger">*</span></label>
					<textarea class="form-control" id="emails" name="emails" rows="3" required
						>{emailsDisplay}</textarea
					>
					<div class="form-text">Enter one email per line or separate with commas.</div>
				</div>

				<div class="mb-3">
					<label for="logo" class="form-label">Logo</label>
					<input class="form-control" type="file" id="logo" name="logo" accept="image/*" />
					<div class="form-text">Optional. Upload a new logo to replace the current one.</div>
				</div>

				{#if data.sponsor.logo}
					<div class="mb-3">
						<p class="form-label mb-1">Current Logo</p>
						<div>
							<img src={data.sponsor.logo} alt="Sponsor logo" style="max-height: 80px;" />
						</div>
					</div>
				{/if}

				<div class="d-flex gap-2">
					<button type="submit" class="btn btn-primary">Save Changes</button>
					<a href="/admin/sponsors" class="btn btn-secondary">Cancel</a>
				</div>
			</form>
		</div>
	</div>

	<div class="card mt-3 border-danger">
		<div class="card-header text-danger">Danger Zone</div>
		<div class="card-body">
			<p>Permanently delete this sponsor. This action cannot be undone.</p>
			<form method="post" action="?/delete" use:enhance>
				<button type="submit" class="btn btn-danger">Delete Sponsor</button>
			</form>
		</div>
	</div>
</div>
