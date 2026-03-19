<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { form }: PageProps = $props();
</script>

<div class="container">
	<h1 class="mt-4">Add Sponsor</h1>

	{#if form?.message}
		<div class="alert alert-danger" role="alert">{form.message}</div>
	{/if}

	<div class="card mt-3">
		<div class="card-body">
			<form method="post" action="?/create" enctype="multipart/form-data" use:enhance>
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
						placeholder="Acme Corporation"
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
						placeholder="e.g. Gold, Silver, Bronze"
					/>
				</div>

				<div class="mb-3">
					<label for="emails" class="form-label">Emails <span class="text-danger">*</span></label>
					<textarea
						class="form-control"
						id="emails"
						name="emails"
						rows="3"
						required
						placeholder="Enter one email per line or comma-separated"
					></textarea>
					<div class="form-text">Enter one email per line or separate with commas.</div>
				</div>

				<div class="mb-3">
					<label for="logo" class="form-label">Logo</label>
					<input class="form-control" type="file" id="logo" name="logo" accept="image/*" />
					<div class="form-text">Optional. Upload a logo image (SVG, PNG, JPG, etc.).</div>
				</div>

				<div class="d-flex gap-2">
					<button type="submit" class="btn btn-primary">Save Sponsor</button>
					<a href="/admin/sponsors" class="btn btn-secondary">Cancel</a>
				</div>
			</form>
		</div>
	</div>
</div>
