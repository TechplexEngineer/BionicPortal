<script lang="ts">
	import DashHeader, { type Page } from "$lib/components/DashHeader.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let navPages: Page[] = [
		{
			name: "Dashboard",
			route: "/dashboard",
			nested: [
				{
					name: "Overview",
					route: "/dashboard"
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Dashboard | Bionic Portal</title>
</svelte:head>

<div class="container">
	<DashHeader pages={navPages} />

	<h2>Events &amp; Photo Albums</h2>
	{#if data.events.length === 0}
		<p class="text-muted">No events have been created yet.</p>
	{:else}
		<table class="table table-striped">
			<thead>
				<tr>
					<th>Event</th>
					<th>Date</th>
					<th>Upload Photos</th>
					<th>Public Album</th>
				</tr>
			</thead>
			<tbody>
				{#each data.events as event (event.id)}
					<tr>
						<td>{event.name}</td>
						<td>{event.dateStr}</td>
						<td>
							{#if event.smugmugUploadUrl}
								<a
									href={event.smugmugUploadUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-sm btn-primary"
								>
									📷 Upload Photos
								</a>
							{:else}
								<span class="text-muted">—</span>
							{/if}
						</td>
						<td>
							{#if event.smugmugAlbumUrl}
								<a
									href={event.smugmugAlbumUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-sm btn-outline-secondary"
								>
									View Album
								</a>
							{:else}
								<span class="text-muted">—</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
