<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let newRoomName = $state("");
	let newRoomGender = $state("Boys");
	let submitting = $state(false);

	let assignedAttendeeIds = $derived(new Set(data.assignments.map((a) => a.studentId || a.userId)));
	let unassignedAttendees = $derived(
		data.attendees.filter((a) => !assignedAttendeeIds.has(a.userid))
	);

	function getAssignmentsForRoom(roomId: string) {
		return data.assignments
			.filter((a) => a.roomId === roomId)
			.map((a) => {
				const attendeeId = a.studentId || a.userId;
				return data.attendees.find((att) => att.userid === attendeeId);
			})
			.filter(Boolean);
	}

	function getRoomCapacity(gender: string) {
		if (gender === "Mentors") return data.event.mentorsPerRoom || 2;
		return data.event.studentsPerRoom || 4;
	}

	let attendeeFilter = $state("");
	let filteredUnassigned = $derived(
		unassignedAttendees.filter((a) =>
			`${a.firstName} ${a.lastName}`.toLowerCase().includes(attendeeFilter.toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Room Assignments | {data.event.name} | Bionic Portal</title>
</svelte:head>

<div class="admin-container-fluid">
	<header class="admin-header">
		<div>
			<h1>Room Assignments</h1>
			<p class="text-muted">{data.event.name} • overnight</p>
		</div>
		<div class="header-actions">
			<a href="/admin/events" class="btn btn-secondary btn-sm">Back to Events</a>
		</div>
	</header>

	<main class="room-assignment-layout">
		<aside class="attendee-sidebar">
			<div class="sidebar-header">
				<h2>Attendees ({unassignedAttendees.length} unassigned)</h2>
				<input
					type="text"
					bind:value={attendeeFilter}
					placeholder="Filter attendees..."
					class="filter-input"
				/>
			</div>

			<div class="attendee-list">
				{#each filteredUnassigned as attendee}
					<div class="attendee-card {attendee.type}">
						<div class="attendee-info">
							<span class="attendee-name">{attendee.firstName} {attendee.lastName}</span>
							<span class="attendee-badge">{attendee.type}</span>
						</div>
						<div class="assign-actions">
							<div class="dropdown">
								<button class="btn btn-sm btn-outline">
									Assign <i class="fa fa-chevron-right"></i>
								</button>
								<div class="dropdown-content">
									{#each data.rooms as room}
										<form method="POST" action="?/assignAttendee" use:enhance>
											<input type="hidden" name="roomId" value={room.id} />
											<input type="hidden" name="attendeeId" value={attendee.userid} />
											<input type="hidden" name="attendeeType" value={attendee.type} />
											<button
												type="submit"
												disabled={getAssignmentsForRoom(room.id).length >=
													getRoomCapacity(room.gender)}
											>
												{room.roomName} ({getAssignmentsForRoom(room.id).length}/{getRoomCapacity(
													room.gender
												)})
											</button>
										</form>
									{/each}
									{#if data.rooms.length === 0}
										<div class="empty-dropdown">No rooms created</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}
				{#if filteredUnassigned.length === 0}
					<p class="empty-text">No unassigned attendees found</p>
				{/if}
			</div>
		</aside>

		<section class="rooms-container">
			<div class="rooms-header-controls">
				<h2>Rooms</h2>
				<form
					method="POST"
					action="?/createRoom"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
							newRoomName = "";
						};
					}}
					class="quick-add-room form-control"
				>
					<input
						type="text"
						name="roomName"
						bind:value={newRoomName}
						placeholder="Room Name"
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
					{@const currentAssignments = getAssignmentsForRoom(room.id)}
					{@const capacity = getRoomCapacity(room.gender)}
					<div class="room-grid-card">
						<div class="room-grid-header">
							<h3>{room.roomName}</h3>
							<span class="gender-tag {room.gender.toLowerCase()}">{room.gender}</span>
						</div>
						<div class="room-slots">
							{#each Array(capacity) as _, i}
								{@const person = currentAssignments[i]}
								<div class="room-slot {person ? 'filled' : 'empty'}">
									{#if person}
										<div class="person-in-slot {person.type}">
											<span class="name">{person.firstName} {person.lastName}</span>
											<form method="POST" action="?/unassignAttendee" use:enhance>
												<input type="hidden" name="attendeeId" value={person.userid} />
												<input type="hidden" name="attendeeType" value={person.type} />
												<button type="submit" class="btn-unassign" title="Unassign">
													<i class="fa fa-times"></i>
												</button>
											</form>
										</div>
									{:else}
										<span class="slot-placeholder">Empty Slot</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
				{#if data.rooms.length === 0}
					<div class="no-rooms-placeholder">
						<i class="fa fa-hotel"></i>
						<p>No rooms have been added to this event yet.</p>
					</div>
				{/if}
			</div>
		</section>
	</main>
</div>

<style>
	.admin-container-fluid {
		padding: 2rem;
		max-width: 100%;
	}

	.admin-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.admin-header h1 {
		margin: 0;
		font-size: 2.5rem;
		font-weight: 800;
		/* background: linear-gradient(135deg, #fff 0%, #8b949e 100%); */
		/* -webkit-background-clip: text; */
		/* -webkit-text-fill-color: transparent; */
	}

	.room-assignment-layout {
		display: grid;
		grid-template-columns: 350px 1fr;
		gap: 2rem;
		height: calc(100vh - 200px);
	}

	.attendee-sidebar {
		background: rgba(22, 27, 34, 0.5);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(48, 54, 61, 0.8);
		border-radius: 1rem;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.sidebar-header {
		padding: 1.5rem;
		border-bottom: 1px solid rgba(48, 54, 61, 0.8);
	}

	.sidebar-header h2 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		color: #58a6ff;
	}

	.attendee-list {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.attendee-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		padding: 1rem;
		border-radius: 0.75rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition:
			transform 0.2s,
			background 0.2s;
	}

	.attendee-card:hover {
		transform: translateX(4px);
		background: rgba(255, 255, 255, 0.06);
	}

	.attendee-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.attendee-name {
		font-weight: 600;
		/* color: #e6edf3; */
	}

	.attendee-badge {
		font-size: 0.7rem;
		text-transform: uppercase;
		font-weight: 700;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		width: fit-content;
	}

	.attendee-card.student .attendee-badge {
		background: rgba(86, 171, 255, 0.1);
		color: #58a6ff;
	}

	.attendee-card.mentor .attendee-badge {
		background: rgba(187, 128, 255, 0.1);
		color: #d2a8ff;
	}

	.rooms-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
		padding-right: 1rem;
	}

	.rooms-header-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(22, 27, 34, 0.3);
		padding: 1rem 1.5rem;
		border-radius: 1rem;
		border: 1px solid rgba(48, 54, 61, 0.5);
	}

	.quick-add-room {
		display: flex;
		gap: 0.75rem;
	}

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 2rem;
	}

	.room-grid-card {
		background: rgba(22, 27, 34, 0.8);
		border: 1px solid rgba(48, 54, 61, 0.8);
		border-radius: 1.25rem;
		padding: 1.5rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		transition: border-color 0.3s;
	}

	.room-grid-card:hover {
		border-color: #58a6ff;
	}

	.room-grid-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(48, 54, 61, 0.5);
	}

	.room-grid-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.gender-tag {
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		padding: 0.25rem 0.75rem;
		border-radius: 2rem;
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

	.room-slots {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.room-slot {
		height: 48px;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		padding: 0 1rem;
		font-size: 0.9rem;
		transition: background 0.2s;
	}

	.room-slot.empty {
		border: 2px dashed rgba(48, 54, 61, 0.8);
		color: #484f58;
		justify-content: center;
	}

	.room-slot.filled {
		background: rgba(48, 54, 61, 0.4);
		border: 1px solid rgba(48, 54, 61, 0.8);
	}

	.person-in-slot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	.person-in-slot .name {
		font-weight: 600;
	}

	.btn-unassign {
		background: transparent;
		border: none;
		color: #f85149;
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	.btn-unassign:hover {
		opacity: 1;
	}

	.dropdown {
		position: relative;
		display: inline-block;
	}

	.dropdown-content {
		display: none;
		position: absolute;
		right: 0;
		background: #161b22;
		min-width: 220px;
		z-index: 100;
		border-radius: 10px;
		border: 1px solid #30363d;
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
		overflow: hidden;
	}

	.dropdown:hover .dropdown-content {
		display: block;
	}

	.dropdown-content button {
		width: 100%;
		text-align: left;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		color: #c9d1d9;
		cursor: pointer;
		font-size: 0.85rem;
		transition: background 0.2s;
	}

	.dropdown-content button:hover:not(:disabled) {
		background: #1f6feb;
		color: white;
	}

	.dropdown-content button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.no-rooms-placeholder {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 5rem;
		color: #484f58;
		border: 2px dashed rgba(48, 54, 61, 0.5);
		border-radius: 2rem;
	}

	.no-rooms-placeholder i {
		font-size: 4rem;
		margin-bottom: 2rem;
		opacity: 0.2;
	}

	.btn-outline {
		border: 1px solid #30363d;
		background: transparent;
		color: #c9d1d9;
	}

	.btn-outline:hover {
		background: rgba(255, 255, 255, 0.05);
	}
</style>
