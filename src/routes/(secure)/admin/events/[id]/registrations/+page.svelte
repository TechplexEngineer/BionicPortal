<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	let updating = $state(false);
</script>

<svelte:head>
	<title>Registrations | {data.event.name} | Bionic Portal</title>
</svelte:head>

<div class="admin-container">
	<header class="admin-header">
		<div>
			<h1>Registrations</h1>
			<p class="text-muted">{data.event.name} • {data.event.startDate}</p>
		</div>
		<div class="header-actions">
			<a href="/admin/events/{data.event.id}/registrations/import" class="btn btn-primary me-2">
				<i class="fa fa-upload me-1"></i> Import Registrations
			</a>
			<a href="/admin/events" class="btn btn-secondary">Back to Events</a>
		</div>
	</header>

	<main class="admin-main">
		{#if data.registrations.length === 0}
			<div class="empty-state">
				<i class="fa fa-users mb-3"></i>
				<p>No registrations yet for this event.</p>
			</div>
		{:else}
			<div class="table-container">
				<table class="admin-table">
					<thead>
						<tr>
							<th>Student Name</th>
							<th>Email</th>
							<th>Payment Status</th>
							<th>Form Status</th>
							<th>Invoicing</th>
							<th>Requirements</th>
						</tr>
					</thead>
					<tbody>
						{#each data.registrations as reg}
							<tr>
								<td><strong>{reg.student.firstName} {reg.student.lastName}</strong></td>
								<td>{reg.student.userid}</td>
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
											class="badge-btn {reg.paid ? 'paid' : 'unpaid'}"
											disabled={updating}
										>
											{reg.paid ? "Paid" : "Unpaid"}
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
											class="badge-btn {reg.formCompleted ? 'completed' : 'pending'}"
											disabled={updating}
										>
											{reg.formCompleted ? "Completed" : "Pending"}
										</button>
									</form>
								</td>
								<td>
									{#if reg.invoiceId}
										<div class="invoice-badge">
											<i class="fa fa-file-invoice me-1"></i>
											{reg.invoiceId}
										</div>
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
											<button type="submit" class="btn btn-primary btn-sm" disabled={updating}>
												Create QB Invoice
											</button>
										</form>
									{/if}
								</td>
								<td>
									<div class="req-indicator {reg.paid && reg.formCompleted ? 'met' : 'unmet'}">
										<i
											class="fa {reg.paid && reg.formCompleted
												? 'fa-check-circle'
												: 'fa-times-circle'}"
										></i>
										{reg.paid && reg.formCompleted ? "All Set" : "Incomplete"}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</main>
</div>

<style>
	.admin-container {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	.admin-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #dee2e6;
	}

	.admin-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #212529; /* Fixed: dark color for light background */
		font-weight: 800;
	}

	.text-muted {
		color: #6c757d !important;
		margin: 0;
	}

	.table-container {
		background: #ffffff;
		border-radius: 1rem;
		border: 1px solid #dee2e6;
		overflow: hidden;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}

	.admin-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	.admin-table th {
		padding: 1.25rem 1rem;
		background: #f8f9fa;
		color: #495057;
		font-weight: 700;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05rem;
		border-bottom: 2px solid #dee2e6;
	}

	.admin-table td {
		padding: 1.25rem 1rem;
		border-bottom: 1px solid #eee;
		color: #212529;
		vertical-align: middle;
	}

	.admin-table tr:hover td {
		background: #fcfcfc;
	}

	.badge-btn {
		border: none;
		padding: 0.4rem 0.8rem;
		border-radius: 2rem;
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
	}

	.badge-btn.paid {
		background: #dcfce7;
		color: #166534;
		border: 1px solid #86efac;
	}
	.badge-btn.unpaid {
		background: #fee2e2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}
	.badge-btn.completed {
		background: #e0f2fe;
		color: #0369a1;
		border: 1px solid #bae6fd;
	}
	.badge-btn.pending {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #fde68a;
	}

	.invoice-badge {
		font-size: 0.85rem;
		color: #495057;
		background: #f8f9fa;
		padding: 0.4rem 0.8rem;
		border-radius: 6px;
		display: inline-flex;
		align-items: center;
		border: 1px solid #dee2e6;
	}

	.req-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.req-indicator.met {
		color: #166534;
	}
	.req-indicator.unmet {
		color: #991b1b;
	}

	.empty-state {
		text-align: center;
		padding: 5rem 2rem;
		color: #6c757d;
		background: #ffffff;
		border: 2px dashed #dee2e6;
		border-radius: 1rem;
	}

	.btn-sm {
		padding: 0.4rem 0.8rem;
		font-size: 0.8rem;
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
		border-color: #5c636a;
	}
</style>
