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

<div class="admin-container">
	<header class="admin-header">
		<h1>Add New Event</h1>
		<a href="/admin/events" class="btn btn-secondary">Back to Events</a>
	</header>

	<main class="admin-main">
		<form
			method="post"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
			class="event-form"
		>
			<div class="form-section">
				<h2>Basic Information</h2>
				<div class="form-group">
					<label for="name">Event Name</label>
					<input
						type="text"
						id="name"
						name="name"
						bind:value={name}
						placeholder="e.g. Granite State Regional"
						required
					/>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label for="startDate">Start Date</label>
						<input type="date" id="startDate" name="startDate" bind:value={startDate} required />
					</div>
					<div class="form-group">
						<label for="endDate">End Date</label>
						<input type="date" id="endDate" name="endDate" bind:value={endDate} required />
					</div>
				</div>
				<div class="form-group">
					<label for="location">Location</label>
					<input
						type="text"
						id="location"
						name="location"
						bind:value={location}
						placeholder="e.g. Bedford High School, Bedford NH"
						required
					/>
				</div>
				<div class="form-group">
					<label for="cost">Cost ($)</label>
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
				<div class="form-group">
					<label for="registrationDueDate">Registration Due Date</label>
					<input
						type="datetime-local"
						id="registrationDueDate"
						name="registrationDueDate"
						bind:value={registrationDueDate}
					/>
				</div>
			</div>

			<div class="form-section">
				<h2>Logistics</h2>
				<div class="form-group checkbox-group">
					<input type="checkbox" id="isOvernight" name="isOvernight" bind:checked={isOvernight} />
					<label for="isOvernight">This is an overnight event</label>
				</div>

				{#if isOvernight}
					<div class="form-group">
						<label for="hotelAddress">Hotel Address</label>
						<input
							type="text"
							id="hotelAddress"
							name="hotelAddress"
							bind:value={hotelAddress}
							placeholder="e.g. 123 Hotel Way, City, ST"
						/>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label for="studentsPerRoom">Students per room</label>
							<input
								type="number"
								id="studentsPerRoom"
								name="studentsPerRoom"
								value="4"
								min="1"
								required
							/>
						</div>
						<div class="form-group">
							<label for="mentorsPerRoom">Mentors per room</label>
							<input
								type="number"
								id="mentorsPerRoom"
								name="mentorsPerRoom"
								value="2"
								min="1"
								required
							/>
						</div>
					</div>
				{/if}

				<div class="form-row">
					<div class="form-group">
						<label for="departureTime">Departure Time</label>
						<input
							type="datetime-local"
							id="departureTime"
							name="departureTime"
							bind:value={departureTime}
						/>
					</div>
					<div class="form-group">
						<label for="returnTime">Return Time</label>
						<input
							type="datetime-local"
							id="returnTime"
							name="returnTime"
							bind:value={returnTime}
						/>
					</div>
				</div>
			</div>

			<div class="form-section">
				<h2>Description</h2>
				<div class="form-group">
					<label for="description">Event Details (optional)</label>
					<textarea
						id="description"
						name="description"
						bind:value={description}
						rows="4"
						placeholder="Any additional information..."
					></textarea>
				</div>
			</div>

			{#if form?.message}
				<div class="alert alert-danger mb-3">
					{form.message}
				</div>
			{/if}

			<div class="form-actions">
				<button type="submit" class="btn btn-primary" disabled={submitting}>
					{#if submitting}
						<i class="fa fa-spinner fa-pulse me-2"></i> Creating...
					{:else}
						Create Event
					{/if}
				</button>
			</div>
		</form>
	</main>
</div>

<style>
	.admin-container {
		max-width: 800px;
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

	.event-form {
		background: #ffffff;
		border: 1px solid #dee2e6;
		border-radius: 1rem;
		padding: 2.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}

	.form-section {
		margin-bottom: 2.5rem;
	}

	.form-section h2 {
		font-size: 1.25rem;
		color: #0d6efd;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid #e9ecef;
		padding-bottom: 0.5rem;
		font-weight: 700;
	}

	.form-group {
		margin-bottom: 1.5rem;
		display: flex;
		flex-direction: column;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	label {
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #495057;
	}

	input[type="text"],
	input[type="date"],
	input[type="datetime-local"],
	input[type="number"],
	textarea {
		background-color: #ffffff;
		border: 1px solid #ced4da;
		border-radius: 8px;
		padding: 0.75rem;
		color: #212529;
		font-family: inherit;
		transition:
			border-color 0.15s ease-in-out,
			box-shadow 0.15s ease-in-out;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #0d6efd;
		box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
	}

	.checkbox-group {
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
	}

	.checkbox-group input {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		padding-top: 1.5rem;
		border-top: 1px solid #dee2e6;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s;
		border: 1px solid transparent;
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

	.btn-secondary:hover {
		background-color: #5c636a;
		border-color: #565e64;
	}

	.alert {
		padding: 1rem;
		border-radius: 8px;
		background-color: #f8d7da;
		border: 1px solid #f5c2c7;
		color: #842029;
	}
</style>
