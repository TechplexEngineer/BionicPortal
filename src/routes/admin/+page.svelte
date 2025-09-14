<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Admin | N.E.R.D.</title>
</svelte:head>

<div class="container">
	<h1>Admin Dashboard</h1>
	<div class="row">
		<div class="col-6 mt-4">
			<div class="card">
				<div class="card-header">Events</div>
				<div class="card-body">
					{#if data.events && data.events.length > 0}
						<ul class="list-group">
							{#each data.events as event}
								<li class="list-group-item">
									<strong>{event.title}</strong><br />
									<small>{event.date} &mdash; {event.location}</small><br />
									<span>{event.description}</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p>No events found.</p>
					{/if}
				</div>
			</div>
		</div>
		<div class="col-6 mt-4">
			<div class="card">
				<div class="card-header">Create Event</div>
				<div class="card-body">
					<form method="POST" use:enhance action="?/createEvent">
						<div class="mb-3">
							<label for="title" class="form-label">Title</label>
							<input id="title" name="title" type="text" class="form-control" required />
						</div>
						<div class="mb-3">
							<label for="date" class="form-label">Date</label>
							<input id="date" name="date" type="date" class="form-control" required />
						</div>
						<div class="mb-3">
							<label for="location" class="form-label">Location</label>
							<input id="location" name="location" type="text" class="form-control" required />
						</div>
						<div class="mb-3">
							<label for="description" class="form-label">Description</label>
							<textarea id="description" name="description" class="form-control"></textarea>
						</div>
						<button type="submit" class="btn btn-primary">Create Event</button>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
