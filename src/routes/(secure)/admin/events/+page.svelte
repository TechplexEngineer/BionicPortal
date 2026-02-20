<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let deletingId = $state("");
</script>

<svelte:head>
	<title>Events | Admin | Bionic Portal</title>
</svelte:head>

<div class="admin-container">
	<header class="admin-header">
		<h1>Events Management</h1>
		<a href="/admin/events/add" class="btn btn-primary">
			<i class="fa fa-plus me-2"></i> Add Event
		</a>
	</header>

	<main class="admin-main">
		{#if data.events.length === 0}
			<div class="empty-state">
				<i class="fa fa-calendar-alt mb-3"></i>
				<p>No events found. Create your first event!</p>
				<a href="/admin/events/add" class="btn btn-secondary mt-3">Add Event</a>
			</div>
		{:else}
			<div class="events-grid">
				{#each data.events as event}
					<div class="event-card">
						<div class="event-header">
							<h2>{event.name}</h2>
							<div class="event-badge {event.isOvernight ? 'overnight' : 'day'}">
								{event.isOvernight ? "Overnight" : "Day Event"}
							</div>
						</div>

						<div class="event-details">
							<div class="detail-item">
								<i class="fa fa-calendar"></i>
								<span>{event.startDate} - {event.endDate}</span>
							</div>
							<div class="detail-item">
								<i class="fa fa-map-marker-alt"></i>
								<span>{event.location}</span>
							</div>
							{#if event.departureTime}
								<div class="detail-item">
									<i class="fa fa-clock"></i>
									<span>Departure: {new Date(event.departureTime).toLocaleString()}</span>
								</div>
							{/if}
						</div>

						<div class="event-actions">
							<a
								href="/admin/events/{event.id}/registrations"
								class="btn btn-secondary btn-sm me-auto"
							>
								<i class="fa fa-users me-1"></i> Registrations
							</a>
							<a href="/admin/events/edit/{event.id}" class="btn btn-icon" title="Edit">
								<i class="fa fa-edit"></i>
							</a>
							<form
								method="post"
								action="?/delete"
								use:enhance={() => {
									deletingId = event.id;
									return async ({ update }) => {
										await update();
										deletingId = "";
									};
								}}
							>
								<input type="hidden" name="id" value={event.id} />
								<button
									type="submit"
									class="btn btn-icon btn-danger"
									title="Delete"
									disabled={deletingId === event.id}
								>
									{#if deletingId === event.id}
										<i class="fa fa-spinner fa-pulse"></i>
									{:else}
										<i class="fa fa-trash"></i>
									{/if}
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	.admin-container {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	.admin-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.admin-header h1 {
		margin: 0;
		font-size: 2.25rem;
		color: #e6edf3;
		font-weight: 800;
	}

	.events-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.event-card {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.event-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		border-color: rgba(88, 166, 255, 0.3);
	}

	.event-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.event-header h2 {
		margin: 0;
		font-size: 1.25rem;
		color: #e6edf3;
		font-weight: 700;
	}

	.event-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.6rem;
		border-radius: 1rem;
		text-transform: uppercase;
	}

	.event-badge.overnight {
		background: rgba(187, 128, 255, 0.15);
		color: #d2a8ff;
		border: 1px solid rgba(187, 128, 255, 0.3);
	}

	.event-badge.day {
		background: rgba(63, 185, 80, 0.15);
		color: #3fb950;
		border: 1px solid rgba(63, 185, 80, 0.3);
	}

	.event-details {
		margin-bottom: 1.5rem;
		flex-grow: 1;
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		color: #8b949e;
		font-size: 0.9rem;
	}

	.detail-item i {
		width: 1rem;
		color: #58a6ff;
	}

	.event-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.empty-state {
		text-align: center;
		padding: 5rem 2rem;
		background: rgba(255, 255, 255, 0.03);
		border: 2px dashed rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		color: #8b949e;
	}

	.empty-state i {
		font-size: 3rem;
		color: #30363d;
	}

	.btn {
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s;
		border: 1px solid transparent;
		font-size: 0.9rem;
	}

	.btn-primary {
		background-color: #238636;
		border-color: #2ea043;
		color: #fff;
	}

	.btn-primary:hover {
		background-color: #2ea043;
		border-color: #3fb950;
	}

	.btn-secondary {
		background-color: #30363d;
		border-color: #8b949e;
		color: #c9d1d9;
	}

	.btn-icon {
		padding: 0.5rem;
		background: transparent;
		color: #8b949e;
		border: none;
	}

	.btn-icon:hover {
		color: #58a6ff;
		background: rgba(88, 166, 255, 0.1);
	}

	.btn-icon.btn-danger:hover {
		color: #f85149;
		background: rgba(248, 81, 73, 0.1);
	}
</style>
