<script lang="ts">
	import { resolve } from "$app/paths";
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();

	let loading = $state(false);
	let studentEmails = $state([""]);

	function addStudentRow() {
		studentEmails.push("");
	}

	function removeStudentRow(index: number) {
		if (studentEmails.length > 1) {
			studentEmails.splice(index, 1);
		}
	}
</script>

<svelte:head>
	<title>Parent Registration | Bionic Portal</title>
</svelte:head>

<div class="container py-5">
	<div class="row justify-content-center">
		<div class="col-md-6">
			<div class="card shadow-sm border-0">
				<div class="card-body p-4">
					<div class="d-flex align-items-start gap-3 mb-2">
						<div
							class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
							style="width: 2.5rem; height: 2.5rem;"
						>
							1
						</div>
						<div>
							<h1 class="h2 card-title fw-bold mb-1">Create your parent account</h1>
							<p class="text-body-secondary mb-0">Signed in as {data.user.username}</p>
						</div>
					</div>
					<p class="text-secondary mt-3 mb-4">
						Your student has already registered. Complete your parent profile and enter the same
						email address they used so we can connect you to their account.
					</p>

					<div class="alert alert-info mb-4" role="note">
						<strong>What happens next?</strong>
						<ol class="mb-0 mt-2 ps-3">
							<li>Complete your parent contact and background information below.</li>
							<li>Link each student using their school email address.</li>
							<li>
								Open your parent dashboard to complete any event forms that need your signature.
							</li>
						</ol>
					</div>

					{#if form?.message}
						<div class="alert alert-danger mb-4" role="alert">
							{form.message}
						</div>
					{/if}

					<form
						method="POST"
						use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								loading = false;
								await update();
							};
						}}
					>
						<div class="row g-3 mb-4">
							<div class="col-md-6">
								<label for="firstName" class="form-label fw-semibold">
									First Name <span class="text-danger">*</span>
								</label>
								<input
									id="firstName"
									name="firstName"
									class="form-control"
									value={data.profile?.firstName ?? ""}
									required
								/>
							</div>
							<div class="col-md-6">
								<label for="lastName" class="form-label fw-semibold">
									Last Name <span class="text-danger">*</span>
								</label>
								<input
									id="lastName"
									name="lastName"
									class="form-control"
									value={data.profile?.lastName ?? ""}
									required
								/>
							</div>
						</div>

						<div class="mb-4">
							<label for="email" class="form-label fw-semibold">
								Email Address <span class="text-danger">*</span>
							</label>
							<input
								id="email"
								name="email"
								type="email"
								class="form-control"
								value={data.profile?.email ?? data.user.username}
								required
							/>
						</div>

						{#if !data.hasProfile}
							<div class="mb-4">
								<label for="phone" class="form-label fw-semibold">
									Your Phone Number <span class="text-danger">*</span>
								</label>
								<div class="input-group">
									<span class="input-group-text bg-white border-end-0">
										<i class="fa fa-phone text-muted"></i>
									</span>
									<input
										type="tel"
										class="form-control border-start-0 ps-0"
										id="phone"
										name="phone"
										placeholder="(555) 555-5555"
										value={data.profile?.phone ?? ""}
										required
									/>
								</div>
							</div>
						{:else}
							<!-- Show existing phone with option to update -->
							<div class="mb-4">
								<label for="phone" class="form-label fw-semibold">Your Phone Number</label>
								<div class="input-group">
									<span class="input-group-text bg-white border-end-0">
										<i class="fa fa-phone text-muted"></i>
									</span>
									<input
										type="tel"
										class="form-control border-start-0 ps-0"
										id="phone"
										name="phone"
										placeholder="(555) 555-5555"
										value={data.profile?.phone ?? ""}
									/>
								</div>
							</div>
						{/if}

						<fieldset class="mb-4">
							<legend class="h6 fw-semibold mb-1">About you</legend>
							<p class="form-text mb-3">
								This information helps the team identify grant and employer-matching opportunities.
							</p>
							<div class="mb-3">
								<label for="educationLevel" class="form-label fw-semibold"
									>Level of Education <span class="text-danger">*</span></label
								>
								<input
									id="educationLevel"
									name="educationLevel"
									class="form-control"
									value={data.profile?.educationLevel ?? ""}
									required
								/>
							</div>
							<div class="row g-3">
								<div class="col-md-6">
									<label for="degree" class="form-label fw-semibold"
										>Degree <span class="text-danger">*</span></label
									>
									<input
										id="degree"
										name="degree"
										class="form-control"
										value={data.profile?.degree ?? ""}
										required
									/>
								</div>
								<div class="col-md-6">
									<label for="jobTitle" class="form-label fw-semibold"
										>Job Title <span class="text-danger">*</span></label
									>
									<input
										id="jobTitle"
										name="jobTitle"
										class="form-control"
										value={data.profile?.jobTitle ?? ""}
										required
									/>
								</div>
							</div>
						</fieldset>

						<div class="mb-4">
							<div class="d-flex justify-content-between align-items-center mb-2">
								<label class="form-label fw-semibold mb-0" for="studentEmail-0">
									Student school email addresses {#if !data.hasProfile}<span class="text-danger"
											>*</span
										>{/if}
								</label>
								<button
									type="button"
									class="btn btn-outline-primary btn-sm"
									onclick={addStudentRow}
								>
									<i class="fa fa-plus me-1" aria-hidden="true"></i>
									Add another student
								</button>
							</div>
							{#each studentEmails as email, index (index)}
								<div class="input-group mb-2">
									<span class="input-group-text bg-white border-end-0">
										<i class="fa fa-envelope text-muted" aria-hidden="true"></i>
									</span>
									<input
										type="email"
										class="form-control border-start-0 ps-0"
										id={`studentEmail-${index}`}
										name="studentEmail"
										aria-label={`Student ${index + 1} school email`}
										placeholder="student@billericak12.com"
										value={email}
										oninput={(event) => (studentEmails[index] = event.currentTarget.value)}
										required={!data.hasProfile || index > 0}
									/>
									{#if studentEmails.length > 1}
										<button
											type="button"
											class="btn btn-outline-secondary"
											aria-label={`Remove student ${index + 1}`}
											onclick={() => removeStudentRow(index)}
										>
											<i class="fa fa-times" aria-hidden="true"></i>
										</button>
									{/if}
								</div>
							{/each}
							<div class="form-text mt-2">
								Use the exact email address your student used when registering. Add another address
								if you have more than one student. Homeschool students can use the personal email on
								their student profile.
							</div>
						</div>

						<div class="d-grid">
							<button type="submit" class="btn btn-primary py-2 fw-bold" disabled={loading}>
								{#if loading}
									<span
										class="spinner-border spinner-border-sm me-2"
										role="status"
										aria-hidden="true"
									></span>
									Connecting...
								{:else}
									{data.hasProfile
										? "Save changes and view dashboard"
										: "Create account and continue"}
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>

			{#if data.linkedStudents && data.linkedStudents.length > 0}
				<div class="mt-5">
					<h4 class="fw-bold mb-3">Linked Students</h4>
					<div class="list-group shadow-sm">
						{#each data.linkedStudents as s (s.userid)}
							<div class="list-group-item d-flex justify-content-between align-items-center py-3">
								<div>
									<div class="fw-semibold">{s.firstName} {s.lastName}</div>
									<div class="small text-muted">{s.userid}</div>
								</div>
								<span class="badge bg-success rounded-pill">Active</span>
							</div>
						{/each}
					</div>
					<div class="mt-3">
						<a href={resolve("/dashboard")} class="btn btn-outline-primary w-100">
							<i class="fa fa-tachometer me-1"></i> Go to Dashboard
						</a>
					</div>
				</div>
			{/if}

			{#if data.pendingStudentLinks && data.pendingStudentLinks.length > 0}
				<div class="mt-5">
					<h4 class="fw-bold mb-3">Pending Students</h4>
					<p class="text-body-secondary">
						These addresses will be linked automatically when the student registers. If you made a
						typo, remove it and add the correct address above.
					</p>
					<div class="list-group shadow-sm">
						{#each data.pendingStudentLinks as pending (pending.studentEmail)}
							<form
								method="POST"
								action="?/removePendingStudent"
								use:enhance
								class="list-group-item d-flex justify-content-between align-items-center py-3"
							>
								<span>{pending.studentEmail}</span>
								<input type="hidden" name="studentEmail" value={pending.studentEmail} />
								<button type="submit" class="btn btn-outline-danger btn-sm">Remove</button>
							</form>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.input-group-text {
		border-right: none;
	}
	.form-control:focus {
		box-shadow: none;
		border-color: #dee2e6;
	}
</style>
