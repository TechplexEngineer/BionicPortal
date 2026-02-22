<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";

	let { form }: { form: ActionData } = $props();

	let email = $state("");
	let code = $state("");
	let requestingCode = $state(false);
	let verifyingCode = $state(false);

	// Update email state if form returns it (e.g. after successful requestCode)
	$effect(() => {
		if (form?.email) {
			email = form.email;
		}
	});

	let step = $derived(form?.success ? "verify" : "request");
</script>

<svelte:head>
	<title>Login | Bionic Portal</title>
</svelte:head>

<div class="login-wrapper">
	<main class="login-container">
		<div class="login-card">
			{#if step === "request"}
				<form
					method="post"
					action="?/requestCode"
					use:enhance={() => {
						requestingCode = true;
						return async ({ update }) => {
							await update({ reset: false });
							requestingCode = false;
						};
					}}
					class="login-form"
				>
					<div class="text-center mb-4">
						<h1 class="h3 fw-bold mb-2">Bionic Portal</h1>
						<p class="text-muted">Sign in with your email</p>
					</div>

					<div class="form-floating mb-4">
						<input
							name="email"
							type="email"
							class="form-control"
							id="email"
							bind:value={email}
							placeholder="name@example.com"
							required
							autocomplete="email"
						/>
						<label for="email">Email address</label>
					</div>

					<button
						class="btn btn-primary w-100 py-3 rounded-3"
						type="submit"
						disabled={requestingCode}
					>
						{#if requestingCode}
							<i class="fa fa-spinner fa-pulse me-2"></i> Sending Code...
						{:else}
							Send Login Code
						{/if}
					</button>
				</form>
			{:else}
				<form
					method="post"
					action="?/loginWithCode"
					use:enhance={() => {
						verifyingCode = true;
						return async ({ update }) => {
							await update();
							verifyingCode = false;
						};
					}}
					class="login-form"
				>
					<div class="text-center mb-4">
						<h1 class="h3 fw-bold mb-2">Verify Email</h1>
						<p class="text-muted">
							We sent a code to <br /><strong class="text-primary">{email}</strong>
						</p>
					</div>

					<input type="hidden" name="email" value={email} />

					<div class="form-floating mb-4">
						<input
							name="code"
							type="text"
							class="form-control"
							id="code"
							bind:value={code}
							placeholder="123456"
							required
							autocomplete="one-time-code"
							autofocus
						/>
						<label for="code">6-Digit Code</label>
					</div>

					<button
						class="btn btn-primary w-100 py-3 rounded-3"
						type="submit"
						disabled={verifyingCode}
					>
						{#if verifyingCode}
							<i class="fa fa-spinner fa-pulse me-2"></i> Verifying...
						{:else}
							Sign In
						{/if}
					</button>

					<div class="text-center mt-4">
						<button
							class="btn btn-link text-decoration-none"
							type="button"
							onclick={() => location.reload()}
						>
							<i class="fa fa-arrow-left me-2"></i> Use a different email
						</button>
					</div>
				</form>
			{/if}

			{#if form?.message}
				<div class="alert alert-danger mt-4" role="alert">
					<i class="fa fa-exclamation-circle me-2"></i>
					{form.message}
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	.login-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 80vh;
		width: 100%;
	}

	.login-container {
		width: 100%;
		max-width: 400px;
		padding: 1rem;
	}

	.login-card {
		background: #ffffff;
		border-radius: 1rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		padding: 2.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
	}

	.fw-bold {
		color: #212529;
	}

	.text-muted {
		color: #6c757d !important;
	}

	.text-primary {
		color: #0d6efd !important;
	}

	.form-control {
		border: 1px solid #dee2e6 !important;
		color: #212529 !important;
		height: 3.5rem;
	}

	.form-control:focus {
		border-color: #0d6efd !important;
		box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
	}

	.btn-primary {
		background-color: #238636;
		border-color: #2ea043;
		font-weight: 700;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #2ea043;
		border-color: #3fb950;
	}

	.btn-link {
		color: #6c757d;
		font-size: 0.9rem;
	}

	.btn-link:hover {
		color: #0d6efd;
	}

	.alert-danger {
		background-color: #f8d7da;
		border-color: #f5c2c7;
		color: #842029;
	}
</style>
