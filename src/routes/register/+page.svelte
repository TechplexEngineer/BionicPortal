<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData, PageProps } from "./$types";

	let { data, form }: PageProps<ActionData> = $props();

	let firstName = $state(data.student?.firstName ?? "");
	let lastName = $state(data.student?.lastName ?? "");
	let dietaryRestrictions = $state(data.student?.dietaryRestrictions ?? "");
	let intoleranceLevel = $state(data.student?.intoleranceLevel ?? "");
	let parentEmails = $state(data.student?.parentEmails ?? "");
	let phone = $state(data.student?.phone ?? "");
	let parentPhone = $state(data.student?.parentPhone ?? "");
	let graduationYear = $state(data.student?.graduationYear ?? "");
	let tshirtSize = $state(data.student?.tshirtSize ?? "");

	let submitting = $state(false);

	const currentYear = new Date().getFullYear();
	const graduationYears = Array.from({ length: 8 }, (_, i) => currentYear + i);

	const tshirtSizes = ["YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "2XL", "3XL"];
</script>

<svelte:head>
	<title>Register Profile | Bionic Portal</title>
</svelte:head>

<div class="register-container">
	<header class="register-header">
		<h1>Student Profile</h1>
		<p class="text-muted">Logged in as <strong>{data.email}</strong></p>
	</header>

	<main class="register-main">
		<form
			method="post"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
			class="register-form"
		>
			<div class="form-section">
				<h2>Basic Information</h2>
				<div class="form-row">
					<div class="form-group">
						<label for="firstName">First Name</label>
						<input
							type="text"
							id="firstName"
							name="firstName"
							bind:value={firstName}
							placeholder="First Name"
							required
						/>
					</div>
					<div class="form-group">
						<label for="lastName">Last Name</label>
						<input
							type="text"
							id="lastName"
							name="lastName"
							bind:value={lastName}
							placeholder="Last Name"
							required
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label for="graduationYear">Year of Graduation <span class="required">*</span></label>
						<select id="graduationYear" name="graduationYear" bind:value={graduationYear} required>
							<option value="">-- Select Year --</option>
							{#each graduationYears as year}
								<option value={year}>{year}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label for="tshirtSize">T-Shirt Size <span class="required">*</span></label>
						<select id="tshirtSize" name="tshirtSize" bind:value={tshirtSize} required>
							<option value="">-- Select Size --</option>
							{#each tshirtSizes as size}
								<option value={size}>{size}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<div class="form-section">
				<h2>Contact Information</h2>
				<div class="form-group">
					<label for="phone">Student Phone Number</label>
					<input
						type="tel"
						id="phone"
						name="phone"
						bind:value={phone}
						placeholder="(555) 555-5555"
					/>
				</div>
				<div class="form-group">
					<label for="parentEmails">Parent Email(s) <span class="required">*</span></label>
					<input
						type="text"
						id="parentEmails"
						name="parentEmails"
						bind:value={parentEmails}
						placeholder="parent1@example.com, parent2@example.com"
						required
					/>
					<small class="text-muted">Separate multiple emails with commas</small>
				</div>
				<div class="form-group">
					<label for="parentPhone">Parent Phone Number(s) <span class="required">*</span></label>
					<input
						type="text"
						id="parentPhone"
						name="parentPhone"
						bind:value={parentPhone}
						placeholder="(555) 555-5555, (555) 555-1234"
						required
					/>
					<small class="text-muted">Separate multiple phone numbers with commas</small>
				</div>
			</div>

			<div class="form-section">
				<h2>Health &amp; Dietary</h2>
				<div class="form-group">
					<label for="dietaryRestrictions">Dietary Restrictions</label>
					<textarea
						id="dietaryRestrictions"
						name="dietaryRestrictions"
						bind:value={dietaryRestrictions}
						rows="3"
						placeholder="e.g. Peanut allergy, Vegetarian, Gluten-free, etc."
					></textarea>
				</div>
				<div class="form-group">
					<label>Level of Dietary Intolerance <span class="required">*</span></label>
					<div class="radio-group">
						<label class="radio-option">
							<input
								type="radio"
								name="intoleranceLevel"
								value="cannot_have"
								checked={intoleranceLevel === "cannot_have"}
								onchange={() => (intoleranceLevel = "cannot_have")}
								required
							/>
							<span
								><strong>Severe:</strong> Cannot have any — life-threatening allergy, always carry epi-pen</span
							>
						</label>
						<label class="radio-option">
							<input
								type="radio"
								name="intoleranceLevel"
								value="epi_pen"
								checked={intoleranceLevel === "epi_pen"}
								onchange={() => (intoleranceLevel = "epi_pen")}
							/>
							<span
								><strong>Moderate:</strong> Carry epi-pen as precaution, can manage in most situations</span
							>
						</label>
						<label class="radio-option">
							<input
								type="radio"
								name="intoleranceLevel"
								value="prefer_not"
								checked={intoleranceLevel === "prefer_not"}
								onchange={() => (intoleranceLevel = "prefer_not")}
							/>
							<span><strong>Mild:</strong> Prefer not to eat — no severe reaction</span>
						</label>
						<label class="radio-option">
							<input
								type="radio"
								name="intoleranceLevel"
								value="none"
								checked={intoleranceLevel === "none"}
								onchange={() => (intoleranceLevel = "none")}
							/>
							<span>No dietary restrictions</span>
						</label>
					</div>
				</div>
			</div>

			{#if data.student?.customFields && Object.keys(data.student.customFields).length > 0}
				<div class="form-section">
					<h2>Additional Questions</h2>
					{#each Object.entries(data.student.customFields) as [key, value]}
						<div class="form-group">
							<label for="custom_{key}">{key}</label>
							<input
								type="text"
								id="custom_{key}"
								name="custom_{key}"
								{value}
								placeholder="Enter your answer"
							/>
						</div>
					{/each}
				</div>
			{/if}

			{#if form?.message}
				<div class="alert alert-{form.success ? 'success' : 'danger'} mb-3">
					{form.message}
				</div>
			{/if}

			<div class="form-actions">
				<button type="submit" class="btn btn-primary" disabled={submitting}>
					{#if submitting}
						<i class="fa fa-spinner fa-pulse me-2"></i> Saving...
					{:else}
						Save Profile
					{/if}
				</button>
			</div>
		</form>
	</main>
</div>

<style>
	.register-container {
		max-width: 700px;
		margin: 3rem auto;
		padding: 0 1rem;
	}

	.register-header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.register-header h1 {
		font-size: 2.5rem;
		font-weight: 800;
		margin-bottom: 0.5rem;
	}

	.register-form {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.5rem;
		padding: 2.5rem;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
	}

	.form-section {
		margin-bottom: 2.5rem;
	}

	.form-section h2 {
		font-size: 1.1rem;
		text-transform: uppercase;
		letter-spacing: 0.1rem;
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
		font-size: 0.95rem;
	}

	.required {
		color: #f85149;
	}

	input[type="text"],
	input[type="tel"],
	select,
	textarea {
		background-color: #161b22;
		border: 1px solid #30363d;
		border-radius: 8px;
		padding: 0.8rem 1rem;
		font-family: inherit;
		transition: all 0.2s;
		color: inherit;
	}

	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: #58a6ff;
		box-shadow: 0 0 0 4px rgba(88, 166, 255, 0.1);
	}

	.radio-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.radio-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-weight: 400;
		padding: 0.6rem 1rem;
		border-radius: 8px;
		border: 1px solid #30363d;
		transition: border-color 0.2s;
	}

	.radio-option:hover {
		border-color: #58a6ff;
	}

	.radio-option input[type="radio"] {
		padding: 0;
		width: auto;
		border: none;
		background: none;
		box-shadow: none;
		accent-color: #58a6ff;
	}

	.text-muted {
		color: #8b949e !important;
		font-size: 0.85rem;
	}

	.form-actions {
		display: flex;
		justify-content: center;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.btn {
		padding: 0.8rem 2.5rem;
		border-radius: 8px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1rem;
	}

	.btn-primary {
		background-color: #238636;
		border: 1px solid #2ea043;
		color: #fff;
		box-shadow: 0 4px 12px rgba(35, 134, 54, 0.2);
	}

	.btn-primary:hover {
		background-color: #2ea043;
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(35, 134, 54, 0.3);
	}

	.alert {
		padding: 1rem;
		border-radius: 8px;
		font-weight: 500;
	}

	.alert-danger {
		background-color: rgba(248, 81, 73, 0.1);
		border: 1px solid rgba(248, 81, 73, 0.2);
		color: #f85149;
	}

	.alert-success {
		background-color: rgba(63, 185, 80, 0.1);
		border: 1px solid rgba(63, 185, 80, 0.2);
		color: #3fb950;
	}
</style>
