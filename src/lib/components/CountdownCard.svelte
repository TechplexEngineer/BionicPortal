<script lang="ts">
	let { name, date }: { name: string; date: string | Date } = $props();

	let boundCounter = $state("?");

	// Set the date we're counting down to
	const targetDate = new Date(date);
	const countDownDate = targetDate.getTime();

	const formattedDate = targetDate.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric"
	});

	// Update the count down every 1 second
	let interval: NodeJS.Timeout | undefined = undefined;

	const countdown = function () {
		// Get today's date and time
		const now = new Date().getTime();

		// Find the distance between now and the count down date
		const distance = countDownDate - now;

		// Time calculations for days, hours, minutes and seconds
		const days = Math.floor(distance / (1000 * 60 * 60 * 24));
		const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((distance % (1000 * 60)) / 1000);

		// Display the result in the element with id="demo"
		boundCounter = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";

		// If the count down is finished, write some text
		if (distance < 0) {
			if (typeof interval != "undefined") {
				clearInterval(interval);
			}
			boundCounter = "Is Here!";
		}
	};
	countdown();

	interval = setInterval(countdown, 1000);
</script>

<div class="card text-center mb-2 py-3">
	<div class="card-body">
		<h5 class="card-title event_name fs-5">{name}</h5>
		<p class="card-text event_counter fs-5 mb-0">{boundCounter}</p>
		<p class="card-text small text-muted event_date">{formattedDate}</p>
	</div>
</div>
