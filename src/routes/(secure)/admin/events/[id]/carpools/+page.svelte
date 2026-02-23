<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let assignedStudentIds = $derived(new Set(data.assignments.map((a) => a.studentId)));
	let unassignedStudents = $derived(
		data.registrations.filter((r) => !assignedStudentIds.has(r.student.userid))
	);

	function getAssignmentsForSpot(spotId: string) {
		return data.assignments
			.filter((a) => a.carpoolSpotId === spotId)
			.map((a) => data.registrations.find((r) => r.student.userid === a.studentId))
			.filter(Boolean);
	}

	let mentorId = $state("");
	let capacity = $state(4);
	let driverName = $state("");
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Carpool Assignments | {data.event.name} | Bionic Portal</title>
</svelte:head>

<div class="admin-container">
	<header class="admin-header">
		<div>
			<h1>Carpool Assignments</h1>
			<p class="text-muted">{data.event.name}</p>
		</div>
		<a href="/admin/carpools" class="btn btn-secondary">Back to Grid</a>
	</header>

	<main class="carpool-assignment-grid">
		<aside class="unassigned-panel">
			<h2>Unassigned Students ({unassignedStudents.length})</h2>
			<div class="student-list">
				{#each unassignedStudents as reg}
					<div class="student-item">
						<span>{reg.student.firstName} {reg.student.lastName}</span>
						<div class="dropdown">
							<button class="btn btn-icon btn-sm"
								>Assign <i class="fa fa-chevron-right ms-1"></i></button
							>
							<div class="dropdown-content">
								{#each data.carpoolSpots as spot}
									<form method="post" action="?/assignStudent" use:enhance>
										<input type="hidden" name="carpoolSpotId" value={spot.id} />
										<input type="hidden" name="studentId" value={reg.student.userid} />
										<button type="submit"
											>{spot.driverName} ({getAssignmentsForSpot(spot.id)
												.length}/{spot.capacity})</button
										>
									</form>
								{/each}
							</div>
						</div>
					</div>
				{/each}
				{#if unassignedStudents.length === 0}
					<p class="empty-text">All students assigned!</p>
				{/if}
			</div>
		</aside>

		<section class="spots-view">
			<div class="spots-header">
				<h2>Carpools</h2>
				<button class="btn btn-primary btn-sm" onclick={() => (submitting = !submitting)}>
					{submitting ? "Cancel" : "Add Carpool"}
				</button>
			</div>

			{#if submitting}
				<form
					method="post"
					action="?/createSpot"
					use:enhance={() => {
						submitting = false;
					}}
					class="add-spot-form card"
				>
					<h3>New Carpool Spot</h3>
					<div class="form-group">
						<label for="mentorId">Mentor</label>
						<select name="mentorId" bind:value={mentorId} required>
							<option value="" disabled>Select Mentor</option>
							{#each data.mentors as mentor}
								<option value={mentor.id}>{mentor.username}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label for="driverName">Driver Name</label>
						<input
							type="text"
							name="driverName"
							bind:value={driverName}
							placeholder="Driver Name"
							required
						/>
					</div>
					<div class="form-group">
						<label for="capacity">Capacity</label>
						<input type="number" name="capacity" bind:value={capacity} min="1" required />
					</div>
					<button type="submit" class="btn btn-primary">Create</button>
				</form>
			{/if}

			<div class="spots-grid">
				{#each data.carpoolSpots as spot}
					<div class="spot-card">
						<div class="spot-header">
							<div>
								<h3>{spot.driverName}</h3>
								<span class="mentor-tag">{spot.mentor.username}</span>
							</div>
							<div class="spot-meta">
								<span
									class="capacity-tag {getAssignmentsForSpot(spot.id).length >= spot.capacity
										? 'full'
										: ''}"
								>
									{getAssignmentsForSpot(spot.id).length} / {spot.capacity}
								</span>
								<form method="post" action="?/deleteSpot" use:enhance>
									<input type="hidden" name="id" value={spot.id} />
									<button
										type="submit"
										class="btn-remove"
										title="Delete Spot"
										aria-label="Delete carpool spot"
									>
										<i class="fa fa-trash"></i>
									</button>
								</form>
							</div>
						</div>
						<div class="spot-students">
							{#each getAssignmentsForSpot(spot.id) as reg}
								{#if reg}
									<div class="assigned-student">
										<span>{reg.student.firstName} {reg.student.lastName}</span>
										<form method="post" action="?/unassignStudent" use:enhance>
											<input type="hidden" name="studentId" value={reg.student.userid} />
											<input type="hidden" name="carpoolSpotId" value={spot.id} />
											<button
												type="submit"
												class="btn-remove"
												title="Unassign"
												aria-label="Unassign student"
											>
												<i class="fa fa-times"></i>
											</button>
										</form>
									</div>
								{/if}
							{/each}
							{#if getAssignmentsForSpot(spot.id).length === 0}
								<p class="empty-spot">Empty Carpool</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>
	</main>
</div>

<style>
	.admin-container {
		max-width: 1400px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	.admin-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 2rem;
	}

	.admin-header h1 {
		margin: 0;
		font-size: 2rem;
		/* color: #e6edf3; */
		font-weight: 800;
	}

	.carpool-assignment-grid {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 2rem;
		align-items: start;
	}

	.unassigned-panel {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 1.5rem;
		position: sticky;
		top: 2rem;
	}

	.unassigned-panel h2 {
		font-size: 1.1rem;
		color: #58a6ff;
		margin-bottom: 1.5rem;
		font-weight: 700;
	}

	.student-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.student-item {
		background: rgba(255, 255, 255, 0.03);
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
	}

	.spots-view {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.spots-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.spots-header h2 {
		font-size: 1.5rem;
		/* color: #e6edf3; */
		margin: 0;
	}

	.spots-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.spot-card {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 1.25rem;
	}

	.spot-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.spot-header h3 {
		margin: 0;
		font-size: 1.1rem;
		/* color: #e6edf3; */
	}

	.mentor-tag {
		font-size: 0.8rem;
		color: #8b949e;
	}

	.spot-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.capacity-tag {
		font-size: 0.8rem;
		padding: 0.2rem 0.5rem;
		border-radius: 1rem;
		background: rgba(46, 160, 67, 0.15);
		color: #3fb950;
		font-weight: 700;
	}

	.capacity-tag.full {
		background: rgba(248, 81, 73, 0.15);
		color: #f85149;
	}

	.spot-students {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.assigned-student {
		background: rgba(255, 255, 255, 0.03);
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
	}

	.btn-remove {
		background: transparent;
		border: none;
		color: #f85149;
		cursor: pointer;
		font-size: 0.8rem;
		padding: 0.2rem;
		transition: color 0.2s;
	}

	.btn-remove:hover {
		color: #ff7b72;
	}

	.empty-spot {
		color: #484f58;
		font-style: italic;
		font-size: 0.85rem;
		text-align: center;
		padding: 1rem 0;
	}

	.dropdown {
		position: relative;
		display: inline-block;
	}

	.dropdown-content {
		display: none;
		position: absolute;
		right: 0;
		background-color: #161b22;
		min-width: 200px;
		box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.5);
		z-index: 10;
		border-radius: 4px;
		border: 1px solid #30363d;
	}

	.dropdown:hover .dropdown-content {
		display: block;
	}

	.dropdown-content form button {
		width: 100%;
		text-align: left;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		/* color: #e6edf3; */
		cursor: pointer;
		font-size: 0.85rem;
	}

	.dropdown-content form button:hover {
		background-color: #1f6feb;
	}

	.add-spot-form {
		padding: 1.5rem;
		margin-bottom: 2rem;
		background: rgba(255, 255, 255, 0.03);
	}

	.add-spot-form h3 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-size: 1.2rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid transparent;
		font-size: 0.9rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
	}

	.btn-primary {
		background-color: #238636;
		color: white;
	}

	.btn-primary:hover {
		background-color: #2ea043;
	}

	.btn-secondary {
		background-color: #30363d;
		border-color: #8b949e;
		color: #c9d1d9;
	}

	.btn-secondary:hover {
		background-color: #3c444d;
	}

	.btn-sm {
		padding: 0.4rem 0.8rem;
		font-size: 0.8rem;
	}

	.text-muted {
		color: #8b949e;
		margin-top: 0.25rem;
	}

	.empty-text {
		color: #8b949e;
		font-style: italic;
		text-align: center;
		margin-top: 1rem;
	}
</style>
