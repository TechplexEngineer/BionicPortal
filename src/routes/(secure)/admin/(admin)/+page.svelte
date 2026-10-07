<script lang="ts">
	import { layoutState } from "../+layout.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	layoutState.pageTitle = "Admin Dashboard";
</script>

<svelte:head>
	<title>{layoutState.pageTitle} | Bionic Portal</title>
</svelte:head>

<div class="container py-4">
	<header class="mb-4 pb-3 border-bottom">
		<h1 class="display-5 fw-bold text-dark mb-0">{layoutState.pageTitle}</h1>
	</header>

	<section aria-labelledby="student-overview-heading" class="mb-5">
		<h2 id="student-overview-heading" class="h4 mb-3">Student Overview</h2>
		<div class="row row-cols-1 row-cols-md-2 g-3">
			<div class="col">
				<div class="card h-100 shadow-sm">
					<div class="card-body">
						<p class="text-muted mb-1">Total active students</p>
						<p class="display-6 fw-bold mb-0">{data.studentOverview.total}</p>
					</div>
				</div>
			</div>
			<div class="col">
				<div class="card h-100 shadow-sm">
					<div class="card-body">
						<p class="text-muted mb-1">Profile completion</p>
						<p class="display-6 fw-bold mb-1">{data.studentOverview.profilePercent}%</p>
						<p class="mb-0 text-muted">
							{data.studentOverview.profileComplete} of {data.studentOverview.total} profiles complete
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section aria-labelledby="event-overview-heading">
		<h2 id="event-overview-heading" class="h4 mb-3">Event Registrations</h2>
		{#if data.events.length === 0}
			<div class="alert alert-light border">No events have been created yet.</div>
		{:else}
			<div class="table-responsive">
				<table class="table table-striped align-middle">
					<thead>
						<tr>
							<th scope="col">Event</th>
							<th scope="col">Date</th>
							<th scope="col" class="text-end">Students registered</th>
						</tr>
					</thead>
					<tbody>
						{#each data.events as event (event.id)}
							<tr>
								<th scope="row">{event.name}</th>
								<td>{event.startDate} – {event.endDate}</td>
								<td class="text-end">{event.registrationCount} students registered</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
