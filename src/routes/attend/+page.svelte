<script lang="ts">
	import type { PageProps } from './$types';
	import CountdownCard from './CountdownCard.svelte';
	import { headerState } from '$lib/components/Header.svelte';
	import TableForObjectArray, {
		type TableColumns
	} from '$lib/components/TableForObjectArray.svelte';
	import { enhance } from '$app/forms';

	let { data }: PageProps = $props();

	headerState.loginVisible = false;

	const notHereColumns: TableColumns = [
		{ data: 'name', title: 'Name' },
		{ data: 'id', title: '', renderSnippet: action }
	];

	const hereColumns: TableColumns = [{ data: 'name', title: 'Name' }];
</script>

<svelte:head>
	<title>Checkin : BionicPortal</title>
</svelte:head>

{#snippet action(memberId: string)}
	<form action="?/checkin" method="post" use:enhance>
		<input type="hidden" name="userid" value={memberId} />
		<button class="btn btn-sm btn-primary">Check In</button>
	</form>
{/snippet}

<div class="container mx-auto">
	<div class="row">
		<div class="col">
			<div class="d-flex justify-content-between align-items-center">
				<h1>Check In</h1>
				<a href="/attend/register" class="btn btn-sm btn-secondary">Register</a>
			</div>
			<TableForObjectArray data={data.membersNotHere} columns={notHereColumns} />
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
				{#if new Date(evt.dateStr).getTime() > Date.now() - 86400000}
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
