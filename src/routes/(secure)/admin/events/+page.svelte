<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
</script>

<div class="container">
	<h1>Events</h1>

	{#if form?.error}
		<div class="alert alert-danger">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="alert alert-success">Event saved successfully.</div>
	{/if}

	<div class="card mb-4">
		<div class="card-header">Create New Event</div>
		<div class="card-body">
			<form method="post" action="?/create" use:enhance>
				<div class="mb-3">
					<label for="name" class="form-label">Event Name</label>
					<input
						type="text"
						id="name"
						name="name"
						class="form-control"
						placeholder="Week 1 - Minuteman District @ BMHS"
						required
					/>
				</div>
				<div class="mb-3">
					<label for="dateStr" class="form-label">Date &amp; Time</label>
					<input
						type="text"
						id="dateStr"
						name="dateStr"
						class="form-control"
						placeholder="Mar 6, 2026 17:00:00 EST"
						required
					/>
					<div class="form-text">
						Use a recognizable date format, e.g. <code>Mar 6, 2026 17:00:00 EST</code>
					</div>
				</div>
				<div class="mb-3">
					<label for="location" class="form-label">Location (optional)</label>
					<input
						type="text"
						id="location"
						name="location"
						class="form-control"
						placeholder="Billerica Memorial High School"
					/>
				</div>
				<button type="submit" class="btn btn-primary"> Create Event &amp; SmugMug Album </button>
			</form>
		</div>
	</div>

	<h2>All Events</h2>
	{#if data.events.length === 0}
		<p class="text-muted">No events yet. Create one above.</p>
	{:else}
		<table class="table table-striped">
			<thead>
				<tr>
					<th>Name</th>
					<th>Date</th>
					<th>Location</th>
					<th>Public Album</th>
					<th>Upload URL</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.events as event (event.id)}
					<tr>
						<td>{event.name}</td>
						<td>{event.dateStr}</td>
						<td>{event.location ?? "—"}</td>
						<td>
							{#if event.smugmugAlbumUrl}
								<a href={event.smugmugAlbumUrl} target="_blank" rel="noopener noreferrer">
									View Album
								</a>
							{:else}
								<span class="text-muted">—</span>
							{/if}
						</td>
						<td>
							{#if event.smugmugUploadUrl}
								<a href={event.smugmugUploadUrl} target="_blank" rel="noopener noreferrer">
									Upload Link
								</a>
							{:else}
								<span class="text-muted">—</span>
							{/if}
						</td>
						<td>
							<form method="post" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={event.id} />
								<button type="submit" class="btn btn-danger btn-sm">Delete</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
