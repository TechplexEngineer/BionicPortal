<script lang="ts">
	import { enhance } from "$app/forms";
	import { layoutState } from "../../../../+layout.svelte";
	import type { PageProps } from "./$types";
	import * as XLSX from "xlsx";

	let { data, form }: PageProps = $props();

	layoutState.pageTitle = "Import Registrations";

	let fileInput: HTMLInputElement;
	let headers: string[] = $state([]);
	let mapping: Record<string, string> = $state({
		email: "",
		firstName: "",
		lastName: "",
		paid: "",
		formCompleted: ""
	});

	let showMapping = $state(false);
	let fileData: any = $state(null);

	async function handleFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;

		const buffer = await file.arrayBuffer();
		const workbook = XLSX.read(buffer, { type: "array" });
		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];
		const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		if (json.length > 0) {
			headers = json[0] as string[];
			autoMap(headers);
			showMapping = true;
		}
	}

	function autoMap(fileHeaders: string[]) {
		const targetFields = ["email", "firstName", "lastName", "paid", "formCompleted"];
		const normalizedHeaders = fileHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

		const searchTerms: Record<string, string[]> = {
			email: ["email", "userid", "user"],
			firstName: ["first", "firstname", "fname", "givenname"],
			lastName: ["last", "lastname", "lname", "surname"],
			paid: ["paid", "payment", "status"],
			formCompleted: ["form", "permission", "completed", "formcompleted"]
		};

		targetFields.forEach((field) => {
			const index = normalizedHeaders.findIndex((h) =>
				searchTerms[field].some((term) => h.includes(term))
			);
			if (index !== -1) {
				mapping[field] = fileHeaders[index];
			}
		});
	}

	function handleSubmit() {
		// We'll pass the mapping as a hidden field or JSON
	}
</script>

<div class="container mt-4">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item"><a href="/admin/events">Events</a></li>
			<li class="breadcrumb-item">
				<a href="/admin/events/{data.event.id}/registrations">Registrations</a>
			</li>
			<li class="breadcrumb-item active" aria-current="page">Import</li>
		</ol>
	</nav>

	<h1>{layoutState.pageTitle}</h1>
	<p class="text-muted">{data.event.name}</p>

	<div class="card mt-4">
		<div class="card-header">Upload Registrations File</div>
		<div class="card-body">
			{#if form?.error}
				<div class="alert alert-danger" role="alert">
					{form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="alert alert-success" role="alert">
					Successfully imported {form.imported} registrations!
					<a href="/admin/events/{data.event.id}/registrations" class="alert-link"
						>Back to registrations</a
					>
				</div>
			{/if}

			{#if !form?.success}
				<form method="post" action="?/import" enctype="multipart/form-data" use:enhance>
					<div class="mb-4">
						<label for="file" class="form-label">Select CSV or Excel file</label>
						<input
							type="file"
							class="form-control"
							id="file"
							name="file"
							accept=".csv,.xlsx,.xls"
							onchange={handleFileChange}
							required
						/>
					</div>

					{#if showMapping}
						<div class="mapping-section mb-4 p-3 border rounded bg-light">
							<h5>Header Mapping</h5>
							<p class="text-muted small">Map columns from your file to the registration fields.</p>

							<div class="row g-3">
								<div class="col-md-6">
									<label for="map_email" class="form-label">Email (Required)</label>
									<select
										id="map_email"
										class="form-select"
										name="map_email"
										bind:value={mapping.email}
										required
									>
										<option value="">-- Choose Column --</option>
										{#each headers as header}
											<option value={header}>{header}</option>
										{/each}
									</select>
								</div>

								<div class="col-md-3">
									<label for="map_firstName" class="form-label">First Name</label>
									<select
										id="map_firstName"
										class="form-select"
										name="map_firstName"
										bind:value={mapping.firstName}
									>
										<option value="">-- Ignore --</option>
										{#each headers as header}
											<option value={header}>{header}</option>
										{/each}
									</select>
								</div>

								<div class="col-md-3">
									<label for="map_lastName" class="form-label">Last Name</label>
									<select
										id="map_lastName"
										class="form-select"
										name="map_lastName"
										bind:value={mapping.lastName}
									>
										<option value="">-- Ignore --</option>
										{#each headers as header}
											<option value={header}>{header}</option>
										{/each}
									</select>
								</div>

								<div class="col-md-6">
									<label for="map_paid" class="form-label">Paid Status</label>
									<select
										id="map_paid"
										class="form-select"
										name="map_paid"
										bind:value={mapping.paid}
									>
										<option value="">-- Ignore (Default: Unpaid) --</option>
										{#each headers as header}
											<option value={header}>{header}</option>
										{/each}
									</select>
								</div>

								<div class="col-md-6">
									<label for="map_formCompleted" class="form-label">Form Status</label>
									<select
										id="map_formCompleted"
										class="form-select"
										name="map_formCompleted"
										bind:value={mapping.formCompleted}
									>
										<option value="">-- Ignore (Default: Pending) --</option>
										{#each headers as header}
											<option value={header}>{header}</option>
										{/each}
									</select>
								</div>
							</div>
						</div>

						<button type="submit" class="btn btn-primary">
							<i class="fa fa-save me-1"></i> Start Import
						</button>
					{/if}
				</form>
			{/if}
		</div>
	</div>
</div>

<style>
	.mapping-section {
		background-color: #f8f9fa;
	}
</style>
