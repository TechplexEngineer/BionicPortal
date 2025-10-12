<script lang="ts">
	import type { PageProps } from "./$types";
	import CountdownCard from "./CountdownCard.svelte";
	import { headerState } from "$lib/components/Header.svelte";

	let { data }: PageProps = $props();

	headerState.loginVisible = false;
</script>

<svelte:head>
	<title>Checkin : BionicPortal</title>
</svelte:head>

<div class="container mx-auto" style="width:500px">
	<h1>Check In</h1>
	<p></p>

	<form action="?/checkin" method="post">
		<div class="input-group mb-3">
			<input
				autocomplete="off"
				type="text"
				class="form-control"
				placeholder="User ID"
				name="userid"
				autofocus
				required
				min="3"
			/>
			<button class="btn btn-primary" type="submit">Check In</button>
		</div>
	</form>

	{#each data.events as evt}
		<CountdownCard name={evt.name} dateStr={evt.dateStr} />
	{/each}
</div>
