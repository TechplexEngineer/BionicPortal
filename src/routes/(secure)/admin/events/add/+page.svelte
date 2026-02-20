<script lang="ts">
	import { enhance } from "$app/forms";
	import { layoutState } from "../../+layout.svelte";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();

	layoutState.pageTitle = "Add Event";
</script>

<div class="container">
	<h1>{layoutState.pageTitle}</h1>

	<form use:enhance>
		<div class="mb-3">
			<label for="exampleFormControlInput1" class="form-label">Email address</label>
			<input
				type="email"
				class="form-control"
				id="exampleFormControlInput1"
				placeholder="name@example.com"
			/>
		</div>
	</form>
</div>
