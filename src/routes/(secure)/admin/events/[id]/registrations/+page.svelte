<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();

	let updating = $state(false);
</script>

<svelte:head>
	<title>Registrations | {data.event.name} | Bionic Portal</title>
</svelte:head>

<div class="container py-4">
	<header class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
		<div>
			<h1 class="display-6 fw-bold mb-0">Registrations</h1>
			<p class="text-muted mb-0">{data.event.name} • {data.event.startDate}</p>
		</div>
		<div class="d-flex gap-2">
			{#if data.registrations.some((r) => !r.invoiceId)}
				<form
					method="post"
					action="?/createAllInvoices"
					use:enhance={() => {
						updating = true;
						return async ({ update }) => {
							await update();
							updating = false;
						};
					}}
				>
					<button type="submit" class="btn btn-outline-primary" disabled={updating}>
						<i class="fa fa-file-invoice-dollar me-1"></i> Create All Missing Invoices
					</button>
				</form>
			{/if}
			<a href="/admin/events/{data.event.id}/registrations/import" class="btn btn-primary">
				<i class="fa fa-upload me-1"></i> Import
			</a>
			<a href="/admin/events" class="btn btn-outline-secondary">Back</a>
		</div>
	</header>

	{#if form?.message}
		<div class="alert alert-danger alert-dismissible fade show mb-4 shadow-sm" role="alert">
			<i class="fa fa-exclamation-triangle me-2"></i>
			{form.message}
			<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
		</div>
	{/if}

	<main>
		{#if data.registrations.length === 0}
			<div class="text-center py-5 bg-light rounded border border-2 border-dashed">
				<i class="fa fa-users fa-4x text-muted opacity-25 mb-3"></i>
				<p class="lead text-muted">No registrations yet for this event.</p>
			</div>
		{:else}
			<div class="card shadow-sm border-0">
				<div class="table-responsive">
					<table class="table table-hover align-middle mb-0">
						<thead class="table-light">
							<tr>
								<th class="ps-4">Student Name</th>
								<th>Email</th>
								<th>Payment</th>
								<th>Forms</th>
								<th>Invoicing</th>
								<th class="pe-4 text-end">Status</th>
							</tr>
						</thead>
						<tbody>
							{#each data.registrations as reg}
								<tr>
									<td class="ps-4"
										><strong>{reg.student.firstName} {reg.student.lastName}</strong></td
									>
									<td class="text-muted small">{reg.student.userid}</td>
									<td>
										<form
											method="post"
											action="?/togglePaid"
											use:enhance={() => {
												updating = true;
												return async ({ update }) => {
													await update();
													updating = false;
												};
											}}
										>
											<input type="hidden" name="id" value={reg.id} />
											<input type="hidden" name="paid" value={reg.paid} />
											<button
												type="submit"
												class="btn btn-sm rounded-pill px-3 {reg.paid
													? 'btn-success-subtle text-success border-success-subtle'
													: 'btn-danger-subtle text-danger border-danger-subtle'} fw-bold"
												disabled={updating}
												style="font-size: 0.7rem;"
											>
												{reg.paid ? "PAID" : "UNPAID"}
											</button>
										</form>
									</td>
									<td>
										<form
											method="post"
											action="?/toggleForm"
											use:enhance={() => {
												updating = true;
												return async ({ update }) => {
													await update();
													updating = false;
												};
											}}
										>
											<input type="hidden" name="id" value={reg.id} />
											<input type="hidden" name="formCompleted" value={reg.formCompleted} />
											<button
												type="submit"
												class="btn btn-sm rounded-pill px-3 {reg.formCompleted
													? 'btn-info-subtle text-info border-info-subtle'
													: 'btn-warning-subtle text-warning border-warning-subtle'} fw-bold"
												disabled={updating}
												style="font-size: 0.7rem;"
											>
												{reg.formCompleted ? "DONE" : "PENDING"}
											</button>
										</form>
									</td>
									<td>
										{#if reg.invoiceId}
											<span class="badge bg-light text-dark border fw-normal py-2 px-3">
												<i class="fa fa-file-invoice me-1 text-primary"></i>
												{reg.invoiceId}
											</span>
										{:else}
											<form
												method="post"
												action="?/createInvoice"
												use:enhance={() => {
													updating = true;
													return async ({ update }) => {
														await update();
														updating = false;
													};
												}}
											>
												<input type="hidden" name="id" value={reg.id} />
												<input type="hidden" name="studentEmail" value={reg.student.userid} />
												<button
													type="submit"
													class="btn btn-outline-primary btn-sm"
													disabled={updating}
												>
													Create QB Invoice
												</button>
											</form>
										{/if}
									</td>
									<td class="pe-4 text-end">
										{#if reg.paid && reg.formCompleted}
											<span class="text-success fw-bold small">
												<i class="fa fa-check-circle me-1"></i> Ready
											</span>
										{:else}
											<span class="text-danger fw-bold small">
												<i class="fa fa-times-circle me-1"></i> Missing
											</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.btn-success-subtle {
		background-color: var(--bs-success-bg-subtle);
	}
	.btn-danger-subtle {
		background-color: var(--bs-danger-bg-subtle);
	}
	.btn-info-subtle {
		background-color: var(--bs-info-bg-subtle);
	}
	.btn-warning-subtle {
		background-color: var(--bs-warning-bg-subtle);
	}

	.border-dashed {
		border-style: dashed !important;
	}
</style>
