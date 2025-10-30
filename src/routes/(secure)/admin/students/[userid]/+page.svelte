<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<div class="container">
	<h1>Edit Student <small>{data.student?.firstName} {data.student?.lastName}</small></h1>
</div>
