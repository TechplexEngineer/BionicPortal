<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let newRoomName = $state("");
	let newRoomGender = $state("Boys");
	let submitting = $state(false);

	let assignedStudentIds = $derived(new Set(data.assignments.map((a) => a.studentId)));
	let unassignedStudents = $derived(data.students.filter((s) => !assignedStudentIds.has(s.userid)));

	function getAssignmentsForRoom(roomId: string) {
		return data.assignments
			.filter((a) => a.roomId === roomId)
			.map((a) => data.students.find((s) => s.userid === a.studentId))
			.filter(Boolean);
	}
</script>

<svelte:head>
	<title>Room Assignments | {data.event.name} | Bionic Portal</title>
</svelte:head>

<div class="admin-container">
	<header class="admin-header">
		<div>
			<h1>Room Assignments</h1>
			<p class="text-muted">{data.event.name} • Overnight Event</p>
		</div>
		<a href="/admin/events" class="btn btn-secondary">Back to Events</a>
	</header>

	<main class="room-assignment-grid">
		<aside class="unassigned-panel">
			<h2>Unassigned Students ({unassignedStudents.length})</h2>
			<div class="student-list">
				{#each unassignedStudents as student}
					<div class="student-item">
						<span>{student.firstName} {student.lastName}</span>
						<div class="dropdown">
							<button class="btn btn-icon btn-sm"
								>Assign <i class="fa fa-chevron-right ms-1"></i></button
							>
							<div class="dropdown-content">
								{#each data.rooms as room}
									<form method="post" action="?/assignStudent" use:enhance>
										<input type="hidden" name="roomId" value={room.id} />
										<input type="hidden" name="studentId" value={student.userid} />
										<button type="submit">{room.roomName} ({room.gender})</button>
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

		<section class="rooms-view">
			<div class="rooms-header">
				<h2>Hotel Rooms</h2>
				<form
					method="post"
					action="?/createRoom"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
							newRoomName = "";
						};
					}}
					class="add-room-form"
				>
					<input
						type="text"
						name="roomName"
						bind:value={newRoomName}
						placeholder="Room Name (e.g. Room 101)"
						required
					/>
					<select name="gender" bind:value={newRoomGender}>
						<option>Boys</option>
						<option>Girls</option>
						<option>Mentors</option>
					</select>
					<button type="submit" class="btn btn-primary btn-sm" disabled={submitting}
						>Add Room</button
					>
				</form>
			</div>

			<div class="rooms-grid">
				{#each data.rooms as room}
					<div class="room-card">
						<div class="room-header">
							<h3>{room.roomName}</h3>
							<span class="gender-tag {room.gender.toLowerCase()}">{room.gender}</span>
						</div>
						<div class="room-students">
							{#each getAssignmentsForRoom(room.id) as student}
								<div class="assigned-student">
									<span>{student.firstName} {student.lastName}</span>
									<form method="post" action="?/unassignStudent" use:enhance>
										<input type="hidden" name="studentId" value={student.userid} />
										<button type="submit" class="btn-remove" title="Unassign">
											<i class="fa fa-times"></i>
										</button>
									</form>
								</div>
							{/each}
							{#if getAssignmentsForRoom(room.id).length === 0}
								<p class="empty-room">Empty Room</p>
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
		color: #e6edf3;
		font-weight: 800;
	}

	.room-assignment-grid {
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

	.rooms-view {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.rooms-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.rooms-header h2 {
		font-size: 1.5rem;
		color: #e6edf3;
		margin: 0;
	}

	.add-room-form {
		display: flex;
		gap: 0.5rem;
	}

	.add-room-form input,
	select {
		background: #161b22;
		border: 1px solid #30363d;
		color: #e6edf3;
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
	}

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.room-card {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 1.25rem;
	}

	.room-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.room-header h3 {
		margin: 0;
		font-size: 1.1rem;
		color: #e6edf3;
	}

	.gender-tag {
		font-size: 0.7rem;
		text-transform: uppercase;
		font-weight: 700;
		padding: 0.2rem 0.5rem;
		border-radius: 1rem;
	}

	.gender-tag.boys {
		background: rgba(88, 166, 255, 0.15);
		color: #58a6ff;
	}
	.gender-tag.girls {
		background: rgba(255, 128, 191, 0.15);
		color: #ff80bf;
	}
	.gender-tag.mentors {
		background: rgba(187, 128, 255, 0.15);
		color: #d2a8ff;
	}

	.room-students {
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
	}

	.empty-room {
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
		min-width: 160px;
		box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.5);
		z-index: 1;
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
		color: #e6edf3;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.dropdown-content form button:hover {
		background-color: #1f6feb;
	}

	.empty-text {
		color: #8b949e;
		font-style: italic;
		text-align: center;
		margin-top: 1rem;
	}
	.btn-sm {
		padding: 0.4rem 0.8rem;
		font-size: 0.8rem;
	}
</style>
