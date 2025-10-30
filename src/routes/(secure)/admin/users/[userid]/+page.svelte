<script lang="ts">
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<div class="container">
	<h1>Edit User <small>{data.user.username}</small></h1>
</div>
