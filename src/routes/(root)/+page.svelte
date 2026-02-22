<script lang="ts">
	import type { PageProps } from "./$types";
	import CountdownCard from "$lib/components/CountdownCard.svelte";

	let { data }: PageProps = $props();

	const oneDayMiliseconds = 24 * 60 * 60 * 1000; // milliseconds in a day
</script>

<svelte:head>
	<title>Home | Team 4909</title>
	<meta
		name="description"
		content="Team 4909 Bionic Robotics is a FIRST Robotics Competition team based in Billerica, MA. We build robots, compete in FRC events, and promote STEM education."
	/>
</svelte:head>

<div class="container">
	<h1>Welcome to Team 4909</h1>
	<p class="lead">
		Team 4909 Billerica Bionic is a <em>FIRST</em> Robotics Competition team based in Billerica, MA.
		"Using robots to build kids" - <em>Dean Kamen</em>
	</p>

	<div class="row">
		<div class="col-md-4 mb-3">
			<div class="card h-100">
				<div class="card-body">
					<h5 class="card-title">For Parents</h5>
					<div class="card-text">
						<ul>
							<li>See upcoming events</li>
							<li>Register your student to compete</li>
							<li>Sign up to volunteer</li>
							<li>View student attendance</li>
						</ul>
					</div>
					<a href="/compete" class="btn btn-primary">Login</a>
				</div>
			</div>
		</div>

		<div class="col-md-4 mb-3">
			<div class="card h-100">
				<div class="card-body">
					<h5 class="card-title">For Students</h5>
					<div class="card-text">
						<ul>
							<li>Sign up for events</li>
							<li>View your attendance history</li>
						</ul>
					</div>
					<a href="/volunteer" class="btn btn-primary">Login</a>
				</div>
			</div>
		</div>

		<div class="col-md-4 mb-3">
			<h3>Upcoming Events</h3>
			{#each data.events as evt}
				{#if new Date(evt.dateStr).getTime() > Date.now() - oneDayMiliseconds}
					<CountdownCard name={evt.name} date={evt.dateStr} />
				{/if}
			{/each}
		</div>
	</div>
</div>
