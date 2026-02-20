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
		<a href="/admin/events" class="btn btn-secondary">Back to Events</a>
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
	}

	.admin-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #e6edf3;
		font-weight: 800;
	}

	.table-container {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		overflow: hidden;
	}

	.admin-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	.admin-table th {
		padding: 1.25rem 1rem;
		background: rgba(255, 255, 255, 0.03);
		color: #8b949e;
		font-weight: 600;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.admin-table td {
		padding: 1.25rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		color: #c9d1d9;
		vertical-align: middle;
	}

	.admin-table tr:hover td {
		background: rgba(255, 255, 255, 0.02);
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
		background: rgba(63, 185, 80, 0.15);
		color: #3fb950;
		border: 1px solid rgba(63, 185, 80, 0.3);
	}
	.badge-btn.unpaid {
		background: rgba(248, 81, 73, 0.15);
		color: #f85149;
		border: 1px solid rgba(248, 81, 73, 0.3);
	}
	.badge-btn.completed {
		background: rgba(88, 166, 255, 0.15);
		color: #58a6ff;
		border: 1px solid rgba(88, 166, 255, 0.3);
	}
	.badge-btn.pending {
		background: rgba(210, 153, 34, 0.15);
		color: #d29922;
		border: 1px solid rgba(210, 153, 34, 0.3);
	}

	.invoice-badge {
		font-size: 0.85rem;
		color: #8b949e;
		background: #161b22;
		padding: 0.4rem 0.8rem;
		border-radius: 6px;
		display: inline-flex;
		align-items: center;
	}

	.req-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.req-indicator.met {
		color: #3fb950;
	}
	.req-indicator.unmet {
		color: #f85149;
	}

	.empty-state {
		text-align: center;
		padding: 5rem 2rem;
		color: #8b949e;
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
	.btn-secondary {
		background-color: #30363d;
		border-color: #8b949e;
		color: #c9d1d9;
	}
</style>
