<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData, PageProps } from "./$types";

	let { form, data }: PageProps = $props();

	let name = $state("");
	let startDate = $state(data.today);
	let endDate = $state(data.today);
	let location = $state("");
	let isOvernight = $state(false);
	let departureTime = $state("");
	let returnTime = $state("");
	let description = $state("");
	let hotelAddress = $state("");
	let cost = $state(150);
	let registrationDueDate = $state("");

	let submitting = $state(false);

	// UX Improvement: Prefill dates for time fields if they are empty
	$effect(() => {
		if (startDate && !departureTime) {
			// Default to start date at 8:00 AM if not set
			departureTime = `${startDate}T08:00`;
		}
		if (endDate && !returnTime) {
			// Default to end date at 5:00 PM if not set
			returnTime = `${endDate}T17:00`;
		}
		if (startDate && !registrationDueDate) {
			// Default to 1 week before the event
			const d = new Date(startDate);
			d.setDate(d.getDate() - 7);
			registrationDueDate = `${d.toISOString().split("T")[0]}T23:59`;
		}
	});
</script>

<svelte:head>
	<title>Add Event | Admin | Bionic Portal</title>
</svelte:head>

<div class="container py-4" style="max-width: 900px;">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<h1 class="">Add New Event</h1>
		<a href="/admin/events" class="btn btn-outline-secondary btn-sm">Back to Events</a>
	</header>

	<main>
		<div class="card shadow-sm">
			<div class="card-body p-4 p-md-5">
				<form
					method="post"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
				>
					<!-- Basic Information -->
					<div class="mb-5">
						<h2 class="h5 mb-4 text-primary border-bottom pb-2 fw-bold">Basic Information</h2>

						<div class="mb-3">
							<label for="name" class="form-label fw-semibold">Event Name</label>
							<input
								type="text"
								id="name"
								name="name"
								bind:value={name}
								class="form-control"
								placeholder="e.g. Granite State Regional"
								required
							/>
						</div>

						<div class="row g-3 mb-3">
							<div class="col-md-6">
								<label for="startDate" class="form-label fw-semibold">Start Date</label>
								<input
									type="date"
									id="startDate"
									name="startDate"
									bind:value={startDate}
									class="form-control"
									required
								/>
							</div>
							<div class="col-md-6">
								<label for="endDate" class="form-label fw-semibold">End Date</label>
								<input
									type="date"
									id="endDate"
									name="endDate"
									bind:value={endDate}
									class="form-control"
									required
								/>
							</div>
						</div>

						<div class="mb-3">
							<label for="location" class="form-label fw-semibold">Location</label>
							<input
								type="text"
								id="location"
								name="location"
								bind:value={location}
								class="form-control"
								placeholder="e.g. Bedford High School, Bedford NH"
								required
							/>
						</div>

						<div class="row g-3 mb-3">
							<div class="col-md-4">
								<label for="cost" class="form-label fw-semibold">Cost ($)</label>
								<input
									type="number"
									id="cost"
									name="cost"
									class="form-control"
									bind:value={cost}
									step="0.01"
									min="0"
									required
								/>
							</div>
							<div class="col-md-8">
								<label for="registrationDueDate" class="form-label fw-semibold"
									>Registration Due Date</label
								>
								<input
									type="datetime-local"
									id="registrationDueDate"
									name="registrationDueDate"
									bind:value={registrationDueDate}
									class="form-control"
								/>
							</div>
						</div>
					</div>

					<!-- Logistics -->
					<div class="mb-5">
						<h2 class="h5 mb-4 text-primary border-bottom pb-2 fw-bold">Logistics</h2>

						<div class="form-check form-switch mb-4">
							<input
								class="form-check-input"
								type="checkbox"
								role="switch"
								id="isOvernight"
								name="isOvernight"
								bind:checked={isOvernight}
							/>
							<label class="form-check-label fw-semibold" for="isOvernight"
								>This is an overnight event</label
							>
						</div>

						{#if isOvernight}
							<div class="mb-3 animate-fade-in">
								<label for="hotelAddress" class="form-label fw-semibold">Hotel Address</label>
								<input
									type="text"
									id="hotelAddress"
									name="hotelAddress"
									bind:value={hotelAddress}
									class="form-control"
									placeholder="e.g. 123 Hotel Way, City, ST"
								/>
							</div>
							<div class="row g-3 mb-4 animate-fade-in">
								<div class="col-6">
									<label for="studentsPerRoom" class="form-label fw-semibold"
										>Students per room</label
									>
									<input
										type="number"
										id="studentsPerRoom"
										name="studentsPerRoom"
										class="form-control"
										value="4"
										min="1"
										required
									/>
								</div>
								<div class="col-6">
									<label for="mentorsPerRoom" class="form-label fw-semibold">Mentors per room</label
									>
									<input
										type="number"
										id="mentorsPerRoom"
										name="mentorsPerRoom"
										class="form-control"
										value="2"
										min="1"
										required
									/>
								</div>
							</div>
						{/if}

						<div class="row g-3">
							<div class="col-md-6">
								<label for="departureTime" class="form-label fw-semibold">Departure Time</label>
								<input
									type="datetime-local"
									id="departureTime"
									name="departureTime"
									bind:value={departureTime}
									class="form-control"
								/>
							</div>
							<div class="col-md-6">
								<label for="returnTime" class="form-label fw-semibold">Return Time</label>
								<input
									type="datetime-local"
									id="returnTime"
									name="returnTime"
									bind:value={returnTime}
									class="form-control"
								/>
							</div>
						</div>
					</div>

					<!-- Description -->
					<div class="mb-5">
						<h2 class="h5 mb-4 text-primary border-bottom pb-2 fw-bold">Description</h2>
						<div>
							<label for="description" class="form-label fw-semibold"
								>Event Details (optional)</label
							>
							<textarea
								id="description"
								name="description"
								bind:value={description}
								rows="4"
								class="form-control"
								placeholder="Any additional information..."
							></textarea>
						</div>
					</div>

					{#if form?.message}
						<div
							class="alert alert-danger px-4 py-3 mb-4 shadow-sm border-0 border-start border-4 border-danger rounded-0 rounded-end"
						>
							<i class="fa fa-exclamation-circle me-2"></i>
							{form.message}
						</div>
					{/if}

					<div class="d-flex justify-content-end pt-4 border-top">
						<button type="submit" class="btn btn-primary shadow-sm" disabled={submitting}>
							{#if submitting}
								<i class="fa fa-spinner fa-pulse me-2"></i> Creating...
							{:else}
								Create Event
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</main>
</div>

<style>
	.animate-fade-in {
		animation: fadeIn 0.3s ease-out;
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
