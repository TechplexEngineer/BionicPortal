<script lang="ts">
	import { enhance } from "$app/forms";
	import { dev } from "$app/environment";
	import type { ActionData, PageData } from "./$types";
	import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
	import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let requesting = $state(false);
	let passkeyBusy = $state(false);
	let passkeyError = $state("");
	let passkeySupported = $state(false);
	$effect(() => {
		passkeySupported = browserSupportsWebAuthn();
	});

	async function signInWithPasskey() {
		passkeyBusy = true;
		passkeyError = "";
		try {
			const optionsResponse = await fetch("/api/passkeys/login/options", { method: "POST" });
			if (!optionsResponse.ok) throw new Error("Could not start passkey sign-in");
			const optionsJSON = (await optionsResponse.json()) as PublicKeyCredentialRequestOptionsJSON;
			const response = await startAuthentication({ optionsJSON });
			const verifyResponse = await fetch("/api/passkeys/login/verify", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ response, next: data.next })
			});
			if (!verifyResponse.ok) throw new Error("Unable to sign in with this passkey");
			const result = (await verifyResponse.json()) as { next: string };
			window.location.assign(result.next);
		} catch (error) {
			passkeyError = error instanceof Error ? error.message : "Passkey sign-in failed";
		} finally {
			passkeyBusy = false;
		}
	}
</script>

<svelte:head><title>Login | Bionic Portal</title></svelte:head>

<main class="container py-5">
	<div class="row justify-content-center">
		<div class="col-12 col-md-7 col-lg-5">
			<div class="card shadow-sm p-4">
				<h1 class="h3 text-center">Bionic Portal</h1>
				{#if dev}
					<p class="text-center text-body-secondary">Development login</p>
				{:else}
					<p class="text-center text-body-secondary">Sign in with an email magic link.</p>
				{/if}
				<p class="text-center text-body-secondary">
					Use a <strong>billericak12.com</strong> email address.
				</p>
				{#if form?.message}
					<div class={form.success ? "alert alert-success" : "alert alert-danger"} role="status">
						{form.message}
					</div>
				{/if}
				{#if passkeyError}<div class="alert alert-danger" role="status">{passkeyError}</div>{/if}
				{#if form?.success && !dev}
					<p>
						Check your inbox for <strong>{form.email}</strong>. Your link expires in 15 minutes.
						Check your spam folder if it does not arrive.
					</p>
				{/if}
				<form
					method="post"
					action={dev ? "?/devLogin" : "?/requestLink"}
					use:enhance={() => {
						requesting = true;
						return async ({ update }) => {
							try {
								await update({ reset: false });
							} finally {
								requesting = false;
							}
						};
					}}
				>
					<input type="hidden" name="next" value={data.next} />
					<div class="mb-3">
						<label for="email" class="form-label">Email address</label>
						<div class="alert alert-warning py-2" role="note">
							Double-check your email address. If it does not match an existing account, we will
							create a new account using it.
						</div>
						<input
							id="email"
							name="email"
							type="email"
							class="form-control"
							autocomplete="email"
							maxlength="254"
							value={form?.email ?? ""}
							placeholder="@billericak12.com"
							required
						/>
					</div>
					<button class="btn btn-primary w-100" type="submit" disabled={requesting}>
						{dev
							? requesting
								? "Signing in…"
								: "Log in"
							: requesting
								? "Sending link…"
								: form?.success
									? "Send another sign-in link"
									: "Send sign-in link"}
					</button>
				</form>
				{#if passkeySupported}
					<div class="text-center my-3 text-body-secondary">or</div>
					<button
						class="btn btn-outline-primary w-100"
						type="button"
						onclick={signInWithPasskey}
						disabled={passkeyBusy}
					>
						{passkeyBusy ? "Signing in…" : "Sign in with a passkey"}
					</button>
				{/if}
			</div>
		</div>
	</div>
</main>
