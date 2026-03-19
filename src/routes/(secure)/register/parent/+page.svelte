<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData, PageProps } from "./$types";

	let { data, form }: PageProps = $props();

	let loading = $state(false);
</script>

<div class="container py-5">
	<div class="row justify-content-center">
		<div class="col-md-6">
			<div class="card shadow-sm border-0">
				<div class="card-body p-4">
					<h2 class="card-title fw-bold mb-4">Connect to Your Student</h2>
					<p class="text-secondary mb-4">
						To manage your student's registrations and view their attendance, please enter their
						school email address below.
					</p>

					{#if form?.message}
						<div class="alert {form.success ? 'alert-success' : 'alert-danger'} mb-4" role="alert">
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
						<div class="mb-4">
							<label for="studentEmail" class="form-label fw-semibold">Student School Email</label>
							<div class="input-group">
								<span class="input-group-text bg-white border-end-0">
									<i class="fa fa-envelope text-muted"></i>
								</span>
								<input
									type="email"
									class="form-control border-start-0 ps-0"
									id="studentEmail"
									name="studentEmail"
									placeholder="student@school.edu"
									required
								/>
							</div>
							<div class="form-text mt-2">
								Your student must have already registered an account with this email.
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
									Connect to Student
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>

			{#if data.links && data.links.length > 0}
				<div class="mt-5">
					<h4 class="fw-bold mb-3">Linked Students</h4>
					<div class="list-group shadow-sm">
						{#each data.links as link}
							<div class="list-group-item d-flex justify-content-between align-items-center py-3">
								<div>
									<div class="fw-semibold">{link.studentId}</div>
									<div class="small text-muted">Connected</div>
								</div>
								<span class="badge bg-success rounded-pill">Active</span>
							</div>
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
