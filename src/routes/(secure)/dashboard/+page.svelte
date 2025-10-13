<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Dashboard | N.E.R.D.</title>
</svelte:head>

<div class="container">
	<h1>Hi, {data?.user.username}!</h1>

	<div class="card mt-4">
		<div class="card-header">Import Students</div>
		<div class="card-body">
			<p>Upload a CSV or xlsx file to import students.</p>
			<p>Columns must be email, first, last</p>
			{#if form?.error}
				<div class="alert alert-danger" role="alert">
					{form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="alert alert-success" role="alert">
					Successfully imported {form.imported} students!
				</div>
			{/if}
			<form method="post" action="?/importstudents" enctype="multipart/form-data" use:enhance>
				<div class="mb-3">
					<label for="studentsList" class="form-label">Upload File</label>
					<input class="form-control" type="file" id="studentsList" name="studentsList" required />
				</div>
				<button type="submit" class="btn btn-primary">Import</button>
			</form>
		</div>
	</div>
</div>
