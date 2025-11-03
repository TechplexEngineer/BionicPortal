<script lang="ts">
	import { headerState } from "$lib/components/Header.svelte";
	import type { TableColumns } from "$lib/components/TableForObjectArray.svelte";
	import { onMount } from "svelte";
	import type { PageProps } from "./$types";
	import { invalidateAll } from "$app/navigation";
	import { enhance } from "$app/forms";
	import TableForObjectArray from "$lib/components/TableForObjectArray.svelte";
	import CountdownCard from "./CountdownCard.svelte";

	let { data, form }: PageProps = $props();

	headerState.loginVisible = false;

	const notHereColumns: TableColumns = [
		{ data: "name", title: "Name" },
		{ data: "id", title: "", renderSnippet: action }
	];

	const hereColumns: TableColumns = [{ data: "name", title: "Name" }];

	const oneDayMiliseconds = 24 * 60 * 60 * 1000; // milliseconds in a day

	const FIVE_MINUTES = 5 * 60 * 1000;
	console.log("Setting up data invalidation interval for attendance page");
	onMount(() => {
		const interval = setInterval(() => {
			invalidateAll();
			console.log("Data invalidated for attendance page");
		}, FIVE_MINUTES);

		return () => clearInterval(interval);
	});

	let filterText = $state("");

	let filteredMembersNotHere = $derived.by(() =>
		data.membersNotHere.filter((member) =>
			member.name.toLowerCase().includes(filterText.toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Checkin : BionicPortal</title>
</svelte:head>

{#snippet action(memberId: string)}
	<form
		action="?/checkin"
		method="post"
		use:enhance
		onsubmit={() =>
			setTimeout(() => {
				filterText = "";
			}, 100)}
	>
		<input type="hidden" name="userid" value={memberId} />
		<button class="btn btn-sm btn-primary" type="submit">Check In</button>
	</form>
{/snippet}

<div class="container mx-auto">
	<div class="row">
		<div class="col">
			{#if form?.error}
				<div class="alert alert-danger" role="alert">
					{form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="alert alert-success" role="alert">Checked in successfully!</div>
			{/if}
			<div class="d-flex justify-content-between align-items-center">
				<a href="/attend/register" class="btn btn-sm btn-secondary me-1">Register</a>

				<input
					type="text"
					class="form-control me-2"
					placeholder="Filter members..."
					bind:value={filterText}
				/>
			</div>

			<TableForObjectArray data={filteredMembersNotHere} columns={notHereColumns} />
		</div>
		<div class="col">
			<div class="d-flex justify-content-between align-items-center">
				<h1>Here</h1>
				<span class="badge bg-secondary rounded-pill">
					{data.membersHere.length}
				</span>
			</div>
			<TableForObjectArray data={data.membersHere} columns={hereColumns} />
		</div>
		<div class="col">
			<h1>Upcomming Events</h1>
			{#each data.events as evt}
				{#if new Date(evt.dateStr).getTime() > Date.now() - oneDayMiliseconds}
					<CountdownCard name={evt.name} dateStr={evt.dateStr} />
				{/if}
			{/each}
		</div>
	</div>

	<!-- <form action="?/checkin" method="post">
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
	</form> -->
</div>
