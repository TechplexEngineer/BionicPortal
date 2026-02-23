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

<div class="container-fluid py-4">
	<header class="d-flex justify-content-between align-items-end mb-4 pb-3 border-bottom">
		<div>
			<h1 class="display-5 fw-bold mb-0">Carpool Assignments</h1>
			<p class="text-muted mb-0">{data.event.name}</p>
		</div>
		<a href="/admin/carpools" class="btn btn-outline-secondary btn-sm">Back to Grid</a>
	</header>

	<div class="row g-4">
		<!-- Unassigned Students Sidebar -->
		<aside class="col-lg-4 col-xl-3">
			<div class="card h-100 shadow-sm border-0">
				<div class="card-header bg-primary text-white py-3">
					<h2 class="h5 mb-0 fw-bold">Unassigned Students ({unassignedStudents.length})</h2>
				</div>
				<div class="card-body p-0 overflow-auto" style="max-height: calc(100vh - 300px);">
					<div class="list-group list-group-flush">
						{#each unassignedStudents as reg}
							<div class="list-group-item d-flex justify-content-between align-items-center py-3">
								<span class="fw-semibold">{reg.student.firstName} {reg.student.lastName}</span>
								<div class="dropdown">
									<button
										class="btn btn-sm btn-outline-primary dropdown-toggle"
										type="button"
										data-bs-toggle="dropdown"
										aria-expanded="false"
									>
										Assign
									</button>
									<ul class="dropdown-menu dropdown-menu-end shadow">
										{#each data.carpoolSpots as spot}
											<li>
												<form method="post" action="?/assignStudent" use:enhance>
													<input type="hidden" name="carpoolSpotId" value={spot.id} />
													<input type="hidden" name="studentId" value={reg.student.userid} />
													<button
														class="dropdown-item d-flex justify-content-between align-items-center"
														type="submit"
													>
														<span>{spot.driverName}</span>
														<small class="text-muted ms-2"
															>({getAssignmentsForSpot(spot.id).length}/{spot.capacity})</small
														>
													</button>
												</form>
											</li>
										{/each}
										{#if data.carpoolSpots.length === 0}
											<li><span class="dropdown-item disabled">No carpools created</span></li>
										{/if}
									</ul>
								</div>
							</div>
						{/each}
						{#if unassignedStudents.length === 0}
							<div class="p-4 text-center text-muted fst-italic">All students assigned!</div>
						{/if}
					</div>
				</div>
			</div>
		</aside>

		<!-- Carpools Grid -->
		<main class="col-lg-8 col-xl-9">
			<div class="d-flex justify-content-between align-items-center mb-4">
				<h2 class="h4 mb-0 fw-bold">Carpools</h2>
				<button
					class="btn btn-primary d-flex align-items-center gap-2"
					onclick={() => (submitting = !submitting)}
				>
					<i class="fa {submitting ? 'fa-times' : 'fa-plus'}"></i>
					{submitting ? "Cancel" : "Add Carpool"}
				</button>
			</div>

			{#if submitting}
				<div class="card shadow-sm mb-4 border-primary">
					<div class="card-header bg-primary-subtle text-primary">
						<h3 class="h5 mb-0 fw-bold">New Carpool Spot</h3>
					</div>
					<div class="card-body">
						<form
							method="post"
							action="?/createSpot"
							use:enhance={() => {
								submitting = false;
							}}
							class="row g-3"
						>
							<div class="col-md-4">
								<label for="mentorId" class="form-label fw-bold">Mentor</label>
								<select name="mentorId" bind:value={mentorId} class="form-select" required>
									<option value="" disabled>Select Mentor</option>
									{#each data.mentors as mentor}
										<option value={mentor.id}>{mentor.username}</option>
									{/each}
								</select>
							</div>
							<div class="col-md-5">
								<label for="driverName" class="form-label fw-bold">Driver Name</label>
								<input
									type="text"
									name="driverName"
									bind:value={driverName}
									class="form-control"
									placeholder="e.g. John's SUV"
									required
								/>
							</div>
							<div class="col-md-3">
								<label for="capacity" class="form-label fw-bold">Capacity</label>
								<input
									type="number"
									name="capacity"
									bind:value={capacity}
									min="1"
									class="form-control"
									required
								/>
							</div>
							<div class="col-12 mt-4">
								<button type="submit" class="btn btn-primary px-4 fw-bold">Create Carpool</button>
							</div>
						</form>
					</div>
				</div>
			{/if}

			<div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
				{#each data.carpoolSpots as spot}
					<div class="col">
						<div class="card h-100 shadow-sm border-0 border-top border-4 border-success">
							<div
								class="card-header bg-white d-flex justify-content-between align-items-start py-3"
							>
								<div>
									<h3 class="h6 mb-0 fw-bold text-dark">{spot.driverName}</h3>
									<small class="text-muted">Mentor: {spot.mentor.username}</small>
								</div>
								<div class="d-flex align-items-center gap-2">
									<span
										class="badge rounded-pill {getAssignmentsForSpot(spot.id).length >=
										spot.capacity
											? 'bg-danger text-white'
											: 'bg-success-subtle text-success'}"
									>
										{getAssignmentsForSpot(spot.id).length} / {spot.capacity}
									</span>
									<form method="post" action="?/deleteSpot" use:enhance>
										<input type="hidden" name="id" value={spot.id} />
										<button
											type="submit"
											class="btn btn-link link-secondary p-0"
											title="Delete Spot"
											aria-label="Delete Carpool Spot"
										>
											<i class="fa fa-trash"></i>
										</button>
									</form>
								</div>
							</div>
							<div class="card-body">
								<div class="list-group list-group-flush border rounded overflow-hidden">
									{#each getAssignmentsForSpot(spot.id) as reg}
										{#if reg}
											<div
												class="list-group-item d-flex justify-content-between align-items-center py-2"
											>
												<span class="small">{reg.student.firstName} {reg.student.lastName}</span>
												<form method="post" action="?/unassignStudent" use:enhance>
													<input type="hidden" name="studentId" value={reg.student.userid} />
													<input type="hidden" name="carpoolSpotId" value={spot.id} />
													<button
														type="submit"
														class="btn btn-link link-danger p-0"
														title="Unassign"
														aria-label="Unassign Student"
													>
														<i class="fa fa-times-circle"></i>
													</button>
												</form>
											</div>
										{/if}
									{/each}
									{#if getAssignmentsForSpot(spot.id).length === 0}
										<div class="p-4 text-center text-muted fst-italic small bg-light">
											Empty Carpool
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}
				{#if data.carpoolSpots.length === 0}
					<div class="col-12 text-center py-5 bg-light rounded border-2 border-dashed">
						<i class="fa fa-car fa-4x text-muted opacity-25 mb-3"></i>
						<p class="text-muted fst-italic">No carpools have been added yet.</p>
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>

<style>
	.border-dashed {
		border-style: dashed !important;
	}
</style>
