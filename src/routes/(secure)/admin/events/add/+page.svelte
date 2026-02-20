<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData, PageProps } from "./$types";

	let { form, data }: PageProps<ActionData> = $props();

	let name = $state("");
	let startDate = $state(data.today);
	let endDate = $state(data.today);
	let location = $state("");
	let isOvernight = $state(false);
	let departureTime = $state("");
	let returnTime = $state("");
	let description = $state("");
	let hotelAddress = $state("");

	let submitting = $state(false);
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
	}

	.admin-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #e6edf3;
	}

	.event-form {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 2rem;
	}

	.form-section {
		margin-bottom: 2.5rem;
	}

	.form-section h2 {
		font-size: 1.25rem;
		color: #58a6ff;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid rgba(88, 166, 255, 0.2);
		padding-bottom: 0.5rem;
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
		color: #e6edf3;
	}

	input[type="text"],
	input[type="date"],
	input[type="datetime-local"],
	textarea {
		background-color: #161b22;
		border: 1px solid #30363d;
		border-radius: 6px;
		padding: 0.75rem;
		color: #e6edf3;
		font-family: inherit;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #58a6ff;
		box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
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
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
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
		background-color: #30363d;
		border-color: #8b949e;
		color: #c9d1d9;
	}

	.btn-secondary:hover {
		background-color: #444c56;
		border-color: #8b949e;
	}

	.alert {
		padding: 1rem;
		border-radius: 6px;
		background-color: rgba(248, 81, 73, 0.1);
		border: 1px solid rgba(248, 81, 73, 0.2);
		color: #f85149;
	}
</style>
