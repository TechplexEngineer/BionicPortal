<script lang="ts">
	import { enhance } from "$app/forms";
	import { layoutState } from "../../+layout.svelte";
	import type { PageProps } from "./$types";
	import * as XLSX from "xlsx";
	import ImportMapping from "$lib/components/ImportMapping.svelte";
	import type { ImportField } from "$lib/utils/import";

	let { data, form }: PageProps = $props();

	layoutState.pageTitle = "Import Students";

	let headers: string[] = $state([]);
	let mapping: Record<string, string> = $state({});
	let showMapping = $state(false);

	const studentFields: ImportField[] = [
		{ name: "email", label: "Email", searchTerms: ["email", "userid", "user"], required: true },
		{
			name: "firstName",
			label: "First Name",
			searchTerms: ["first", "firstname", "fname", "givenname"],
			required: true
		},
		{
			name: "lastName",
			label: "Last Name",
			searchTerms: ["last", "lastname", "lname", "surname"],
			required: true
		}
	];

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
			showMapping = true;
		}
	}
</script>

<div class="container mt-4">
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li class="breadcrumb-item"><a href="/admin/students">Students</a></li>
			<li class="breadcrumb-item active" aria-current="page">Import</li>
		</ol>
	</nav>

	<h1>{layoutState.pageTitle}</h1>

	<div class="card mt-4">
		<div class="card-header">Upload Students File</div>
		<div class="card-body">
			{#if form?.error}
				<div class="alert alert-danger" role="alert">
					{form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="alert alert-success" role="alert">
					Successfully imported {form.imported} students!
					<a href="/admin/students" class="alert-link">Back to students</a>
				</div>
			{/if}

			{#if !form?.success}
				<form method="post" action="?/importstudents" enctype="multipart/form-data" use:enhance>
					<div class="mb-4">
						<label for="studentsList" class="form-label">Select CSV or Excel file</label>
						<input
							type="file"
							class="form-control"
							id="studentsList"
							name="studentsList"
							accept=".csv,.xlsx,.xls"
							onchange={handleFileChange}
							required
						/>
					</div>

					{#if showMapping}
						<ImportMapping {headers} fields={studentFields} bind:mapping />

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
	.container {
		max-width: 800px;
	}
</style>
