<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";

	let { form }: { form: ActionData } = $props();

	let email = $state(form?.email ?? "");
	let code = $state("");
	let requestingCode = $state(false);
	let verifyingCode = $state(false);

	let step = $derived(form?.success ? "verify" : "request");
</script>

<svelte:head>
	<title>Login | Bionic Portal</title>
</svelte:head>

<main class="form-signin w-100 m-auto">
	{#if step === "request"}
		<form method="post" action="?/requestCode" use:enhance={() => {
			requestingCode = true;
			return async ({ update }) => {
				await update();
				requestingCode = false;
			};
		}}>
			<h1 class="h3 mb-3 fw-normal">Sign in to Bionic Portal</h1>
			<p class="text-muted">Enter your email and we'll send you a login code.</p>
			
			<div class="form-floating mb-3">
				<input
					name="email"
					type="email"
					class="form-control"
					id="email"
					bind:value={email}
					placeholder="name@example.com"
					required
				/>
				<label for="email">Email address</label>
			</div>

			<button class="btn btn-primary w-100 py-2" type="submit" disabled={requestingCode}>
				{#if requestingCode}
					<i class="fa fa-spinner fa-pulse me-2"></i> Sending...
				{:else}
					Send Code
				{/if}
			</button>
		</form>
	{:else}
		<form method="post" action="?/loginWithCode" use:enhance={() => {
			verifyingCode = true;
			return async ({ update }) => {
				await update();
				verifyingCode = false;
			};
		}}>
			<h1 class="h3 mb-3 fw-normal">Check your email</h1>
			<p class="text-muted">We sent a code to <strong>{email}</strong></p>
			
			<input type="hidden" name="email" value={email} />

			<div class="form-floating mb-3">
				<input
					name="code"
					type="text"
					class="form-control"
					id="code"
					bind:value={code}
					placeholder="123456"
					required
					autocomplete="one-time-code"
				/>
				<label for="code">Verification Code</label>
			</div>

			<button class="btn btn-primary w-100 py-2" type="submit" disabled={verifyingCode}>
				{#if verifyingCode}
					<i class="fa fa-spinner fa-pulse me-2"></i> Verifying...
				{:else}
					Sign In
				{/if}
			</button>

			<button class="btn btn-link w-100 mt-2" type="button" onclick={() => location.reload()}>
				Send another code
			</button>
		</form>
	{/if}

	{#if form?.message}
		<div class="alert alert-danger mt-3" role="alert">
			{form.message}
		</div>
	{/if}
</main>

<style>
	.form-signin {
		max-width: 400px;
		padding: 2rem 1rem;
		margin-top: 5rem !important;
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	:global(body) {
		background-color: #0d1117;
		color: #e6edf3;
		font-family: 'Inter', sans-serif;
	}

	.form-control {
		background-color: #161b22;
		border-color: #30363d;
		color: #e6edf3;
	}

	.form-control:focus {
		background-color: #161b22;
		border-color: #58a6ff;
		color: #e6edf3;
		box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
	}

	.btn-primary {
		background-color: #238636;
		border-color: #2ea043;
		font-weight: 600;
	}

	.btn-primary:hover {
		background-color: #2ea043;
		border-color: #3fb950;
	}

	.alert {
		background-color: rgba(248, 81, 73, 0.1);
		border-color: rgba(248, 81, 73, 0.2);
		color: #f85149;
	}
</style>
