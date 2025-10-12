<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";

	let { form }: { form: ActionData } = $props();

	let submitting = $state(false);
	let visible = $derived(submitting ? "display: inline-block;" : "display: none;");
</script>

<svelte:head>
	<title>Login | N.E.R.D.</title>
</svelte:head>

<main class="form-signin w-100 m-auto">
	<form method="post" action="?/login" use:enhance onsubmit={() => (submitting = true)}>
		<h1 class="h3 mb-3 fw-normal">Please Sign In</h1>
		<div class="form-floating">
			<input
				name="username"
				type="email"
				class="form-control"
				id="email"
				placeholder="name@example.com"
			/>
			<label for="email">Email address</label>
		</div>
		<div class="form-floating">
			<input
				name="password"
				type="password"
				class="form-control"
				id="password"
				placeholder="Password"
			/>
			<label for="password">Password</label>
		</div>
		<button class="btn btn-primary w-100 py-2" type="submit" disabled={submitting}>
			Sign In
			<i class="fa fa-spinner fa-pulse" style={visible}></i>
		</button>
		<button class="text-center w-100 py-2 d-inline-block btn btn-link" formaction="?/register">
			Register
		</button>
		<p style="color: red">{form?.message ?? ""}</p>
	</form>
</main>

<style>
	.form-signin {
		max-width: 330px;
		padding: 1rem;
	}

	.form-signin .form-floating:focus-within {
		z-index: 2;
	}

	.form-signin input[type="email"] {
		margin-bottom: -1px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
	}

	.form-signin input[type="password"] {
		margin-bottom: 10px;
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}
</style>
