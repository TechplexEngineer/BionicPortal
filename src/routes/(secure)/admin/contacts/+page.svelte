<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();

	const typeLabel: Record<string, string> = {
		parent: "Parent",
		sponsor: "Sponsor",
		mentor: "Mentor"
	};
</script>

<svelte:head>
	<title>Contacts | Admin</title>
</svelte:head>

<div class="container">
	<h1>Contacts</h1>
	<p class="text-muted">Manage parents, sponsors, and mentors for mail merge.</p>

	<div class="card mt-4">
		<div class="card-header">Add Contact</div>
		<div class="card-body">
			{#if form?.error}
				<div class="alert alert-danger" role="alert">{form.error}</div>
			{/if}
			{#if form?.success}
				<div class="alert alert-success" role="alert">Contact saved successfully.</div>
			{/if}
			<form method="post" action="?/add" use:enhance>
				<div class="row g-3">
					<div class="col-md-4">
						<label for="name" class="form-label">Name</label>
						<input type="text" class="form-control" id="name" name="name" required />
					</div>
					<div class="col-md-4">
						<label for="email" class="form-label">Email</label>
						<input type="email" class="form-control" id="email" name="email" required />
					</div>
					<div class="col-md-3">
						<label for="type" class="form-label">Type</label>
						<select class="form-select" id="type" name="type" required>
							<option value="">-- Select type --</option>
							<option value="parent">Parent</option>
							<option value="sponsor">Sponsor</option>
							<option value="mentor">Mentor</option>
						</select>
					</div>
					<div class="col-md-1 d-flex align-items-end">
						<button type="submit" class="btn btn-primary w-100">Add</button>
					</div>
				</div>
			</form>
		</div>
	</div>

	<div class="card mt-4">
		<div class="card-header">Contact List</div>
		<div class="card-body p-0">
			{#if data.contacts.length === 0}
				<p class="p-3 text-muted mb-0">No contacts yet. Add one above.</p>
			{:else}
				<table class="table table-hover mb-0">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Type</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.contacts as contact}
							<tr>
								<td>{contact.name}</td>
								<td>{contact.email}</td>
								<td
									><span class="badge bg-secondary">{typeLabel[contact.type] ?? contact.type}</span
									></td
								>
								<td>
									<form method="post" action="?/delete" use:enhance>
										<input type="hidden" name="id" value={contact.id} />
										<button type="submit" class="btn btn-danger btn-sm">Delete</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>
</div>
