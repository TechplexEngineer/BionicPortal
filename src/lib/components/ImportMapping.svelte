<script lang="ts">
	import type { ImportField } from "$lib/utils/import";
	import { autoMap } from "$lib/utils/import";

	let {
		headers = [],
		fields = [],
		mapping = $bindable({})
	}: {
		headers: string[];
		fields: ImportField[];
		mapping: Record<string, string>;
	} = $props();

	$effect(() => {
		if (headers.length > 0 && Object.keys(mapping).length === 0) {
			mapping = autoMap(headers, fields);
		}
	});

	function handleMapChange(fieldName: string, value: string) {
		mapping[fieldName] = value;
	}
</script>

<div class="mapping-section mb-4 p-3 border rounded bg-light">
	<h5>Header Mapping</h5>
	<p class="text-muted small">Map columns from your file to the target fields.</p>

	<div class="row g-3">
		{#each fields as field}
			<div class="col-md-6 col-lg-4">
				<label for="map_{field.name}" class="form-label">
					{field.label}
					{#if field.required}
						<span class="text-danger">*</span>
					{/if}
				</label>
				<select
					id="map_{field.name}"
					class="form-select"
					name="map_{field.name}"
					bind:value={mapping[field.name]}
					required={field.required}
				>
					<option value="">-- {field.required ? "Choose Column" : "Ignore"} --</option>
					{#each headers as header}
						<option value={header}>{header}</option>
					{/each}
				</select>
			</div>
		{/each}
	</div>
</div>

<style>
	.mapping-section {
		background-color: #f8f9fa;
	}
	.text-danger {
		color: #dc3545;
	}
</style>
