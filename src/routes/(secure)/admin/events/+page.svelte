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
							<a href="/admin/events/{event.id}/edit" class="btn btn-icon" title="Edit">
								<i class="fa fa-edit"></i>
							</a>
							<form
								method="post"
								action="?/delete"
								onsubmit={(e) => {
									if (
										!confirm(
											"Are you sure you want to delete this event? This action cannot be undone."
										)
									) {
										e.preventDefault();
									}
								}}
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
		padding-bottom: 1rem;
		border-bottom: 2px solid #dee2e6;
	}

	.admin-header h1 {
		margin: 0;
		font-size: 2.25rem;
		color: #212529;
		font-weight: 800;
	}

	.events-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.event-card {
		background: #ffffff;
		border: 1px solid #dee2e6;
		border-radius: 1rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}

	.event-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
		border-color: #0d6efd;
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
		color: #212529;
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
		background: #f3e8ff;
		color: #6b21a8;
		border: 1px solid #d8b4fe;
	}

	.event-badge.day {
		background: #dcfce7;
		color: #166534;
		border: 1px solid #86efac;
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
		color: #495057;
		font-size: 0.95rem;
	}

	.detail-item i {
		width: 1rem;
		color: #0d6efd;
	}

	.event-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid #dee2e6;
	}

	.empty-state {
		text-align: center;
		padding: 5rem 2rem;
		background: #ffffff;
		border: 2px dashed #dee2e6;
		border-radius: 1rem;
		color: #6c757d;
	}

	.empty-state i {
		font-size: 3rem;
		color: #dee2e6;
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
		background-color: #6c757d;
		border-color: #6c757d;
		color: #fff;
	}

	.btn-icon {
		padding: 0.5rem;
		background: transparent;
		color: #6c757d;
		border: none;
	}

	.btn-icon:hover {
		color: #0d6efd;
		background: rgba(13, 110, 253, 0.1);
	}

	.btn-icon.btn-danger:hover {
		color: #dc3545;
		background: rgba(220, 53, 69, 0.1);
	}

	.btn-sm {
		padding: 0.4rem 0.8rem;
		font-size: 0.8rem;
	}
</style>
