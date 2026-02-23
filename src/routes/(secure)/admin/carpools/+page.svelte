<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	function getSpot(eventId: string, mentorId: string) {
		return data.carpoolSpots.find((s) => s.eventId === eventId && s.mentorId === mentorId);
	}
</script>

<svelte:head>
	<title>Carpool Grid | Admin | Bionic Portal</title>
</svelte:head>

<div class="admin-container">
	<header class="admin-header">
		<h1>Carpool Signup</h1>
		<a href="/admin/events" class="btn btn-secondary">Back to Events</a>
	</header>

	<main class="carpool-grid-container">
		<div class="table-responsive">
			<table class="carpool-table">
				<thead>
					<tr>
						<th class="sticky-col">Mentor</th>
						{#each data.events as event, i}
							<th>
								<div class="event-col-header">
									<span class="week-label">Week {i}</span>
									<span class="event-name">{event.name}</span>
									<span class="event-date"
										>{new Date(event.startDate).toLocaleDateString(undefined, {
											month: "numeric",
											day: "numeric"
										})}</span
									>
									<a href="/admin/events/{event.id}/carpools" class="btn-link">Manage Assignments</a
									>
								</div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					<tr class="info-row">
						<td class="sticky-col"><strong>Location</strong></td>
						{#each data.events as event}
							<td><small>{event.location}</small></td>
						{/each}
					</tr>

					{#each data.mentors as mentor}
						<tr>
							<td class="sticky-col mentor-name">{mentor.username}</td>
							{#each data.events as event}
								<td class="cell-input">
									<form method="post" action="?/saveSpot" use:enhance>
										<input type="hidden" name="eventId" value={event.id} />
										<input type="hidden" name="mentorId" value={mentor.id} />
										<input
											type="text"
											name="capacity"
											class="grid-input"
											value={getSpot(event.id, mentor.id)?.capacity ?? ""}
											placeholder="Qty"
											onchange={(e) => e.currentTarget.form?.requestSubmit()}
										/>
									</form>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</main>
</div>

<style>
	.admin-container {
		max-width: 100%;
		margin: 2rem;
		padding: 0;
	}

	.admin-header {
		margin-bottom: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.admin-header h1 {
		margin: 0;
		font-size: 2.5rem;
		/* color: #e6edf3; */
		font-weight: 800;
	}

	.carpool-grid-container {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		overflow: hidden;
	}

	.table-responsive {
		overflow-x: auto;
	}

	.carpool-table {
		width: 100%;
		border-collapse: collapse;
		color: #c9d1d9;
	}

	.carpool-table th,
	.carpool-table td {
		padding: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		text-align: center;
		min-width: 150px;
	}

	.sticky-col {
		position: sticky;
		left: 0;
		background: #161b22;
		z-index: 2;
		min-width: 200px;
		text-align: left !important;
		font-weight: 700;
	}

	.event-col-header {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.week-label {
		font-size: 0.75rem;
		color: #58a6ff;
		font-weight: 800;
		text-transform: uppercase;
	}
	.event-name {
		font-size: 0.95rem;
		font-weight: 700;
	}
	.event-date {
		font-size: 0.8rem;
		color: #8b949e;
	}

	.btn-link {
		font-size: 0.75rem;
		color: #58a6ff;
		text-decoration: none;
		font-weight: 600;
		margin-top: 0.5rem;
	}

	.btn-link:hover {
		text-decoration: underline;
	}

	.info-row td {
		background: rgba(255, 255, 255, 0.02);
		font-size: 0.85rem;
	}

	.mentor-name_DISABLE {
		/* color: #e6edf3; */
	}

	.grid-input {
		width: 100%;
		background: transparent;
		border: 1px solid transparent;
		/* color: #e6edf3; */
		text-align: center;
		padding: 0.5rem;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.grid-input:focus,
	.grid-input:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: #58a6ff;
		outline: none;
	}

	.grid-input::placeholder {
		color: #484f58;
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

	.btn-secondary {
		background-color: #30363d;
		border-color: #8b949e;
		color: #c9d1d9;
	}
</style>
