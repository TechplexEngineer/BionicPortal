<script lang="ts">
	import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
	import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
	import { invalidateAll } from "$app/navigation";
	import type { ActionData, PageData } from "./$types";
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let busy = $state(false);
	let message = $state("");
	let supported = $state(false);
	$effect(() => {
		supported = browserSupportsWebAuthn();
	});

	async function addPasskey() {
		busy = true;
		message = "";
		try {
			const optionsResponse = await fetch("/api/passkeys/register/options", { method: "POST" });
			if (!optionsResponse.ok) throw new Error("Could not start passkey setup");
			const optionsJSON = (await optionsResponse.json()) as PublicKeyCredentialCreationOptionsJSON;
			const response = await startRegistration({ optionsJSON });
			const verifyResponse = await fetch("/api/passkeys/register/verify", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(response)
			});
			if (!verifyResponse.ok) throw new Error("Could not save this passkey");
			message = "Passkey added.";
			await invalidateAll();
		} catch (error) {
			message = error instanceof Error ? error.message : "Passkey setup failed";
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>Passkeys | Bionic Portal</title></svelte:head>

<main class="container py-4">
	<h1 class="h3">Passkeys</h1>
	<p>Use your device's screen lock to sign in. Your email sign-in link remains available.</p>
	{#if message || form?.message}<div class="alert alert-info" role="status">
			{message || form?.message}
		</div>{/if}
	{#if data.isImpersonating}
		<p class="alert alert-warning">Stop impersonating to manage passkeys.</p>
	{:else}
		<button
			class="btn btn-primary mb-4"
			type="button"
			onclick={addPasskey}
			disabled={busy || !supported}
		>
			{busy ? "Adding passkey…" : "Add a passkey"}
		</button>
		{#if !supported}<p>Your browser does not support passkeys.</p>{/if}
		<h2 class="h5">Your passkeys</h2>
		{#if data.passkeys.length === 0}<p>No passkeys added yet.</p>{/if}
		<ul class="list-group">
			{#each data.passkeys as key (key.id)}
				<li class="list-group-item d-flex justify-content-between align-items-center">
					<span>{key.name} · added {new Date(key.createdAt).toLocaleDateString()}</span>
					<form method="POST" action="?/remove">
						<input type="hidden" name="id" value={key.id} />
						<button class="btn btn-outline-danger btn-sm" type="submit">Remove</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
	{#if data.next}<a class="btn btn-link mt-3" href={data.next}>Continue to the portal</a>{/if}
</main>
