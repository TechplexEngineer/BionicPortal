<script lang="ts">
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import SvelteMarkdown from "@humanspeak/svelte-markdown";
	import { adminNavPages } from "$lib/adminNavigation";
	import DashHeader from "$lib/components/DashHeader.svelte";
	import { searchSops } from "$lib/sopSearch";
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
	let query = $state("");
	let editorMode = $state<"new" | "edit" | null>(null);
	let editingSopId = $state<string | null>(null);
	let draftTitle = $state(data.selectedSop?.title ?? "");
	let draftContent = $state(data.selectedSop?.content ?? "");
	let draftShared = $state(false);

	let filteredSops = $derived.by(() => {
		return searchSops(data.sops, query);
	});

	$effect(() => {
		if (editorMode === "edit" && editingSopId !== data.selectedSop?.id) {
			editorMode = null;
		}
		if (editorMode === null) {
			draftTitle = data.selectedSop?.title ?? "";
			draftContent = data.selectedSop?.content ?? "";
			draftShared = data.selectedSop?.private === false;
		}
	});

	const isAdmin = $derived(data.user.role === "admin");
	const isManager = $derived(data.user.role === "admin" || data.user.role === "mentor");
	const isStudent = $derived(data.user.role === "user");
	const archivedView = $derived(page.url.searchParams.get("archived") === "1");
	const activeHref = (id: string) => resolve(`/sops?id=${encodeURIComponent(id)}`);
	const selectedHref = (id: string) =>
		resolve(`/sops?${archivedView ? "archived=1&" : ""}id=${encodeURIComponent(id)}`);
</script>

<svelte:head><title>SOPs | Bionic Portal</title></svelte:head>

<div class="container py-3">
	{#if isAdmin}
		<DashHeader pages={adminNavPages} />
	{/if}
	<div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
		<div>
			<h1 class="mb-1">Standard Operating Procedures</h1>
			<p class="text-muted mb-0">Browse and manage standard operating procedures.</p>
		</div>
		{#if isManager}
			<button
				class="btn btn-primary"
				type="button"
				onclick={() => {
					editingSopId = null;
					editorMode = "new";
					draftTitle = "";
					draftContent = "";
					draftShared = false;
				}}
			>
				<i class="fa fa-plus me-1"></i> New SOP
			</button>
		{/if}
	</div>

	{#if form?.message}<div
			class="alert {form.success ? 'alert-success' : 'alert-danger'}"
			role="alert"
		>
			{form.message}
		</div>{/if}

	<div class="row g-4">
		<aside class="col-lg-4" aria-label="Available SOPs">
			{#if isManager}
				<nav class="btn-group mb-3 w-100" aria-label="SOP status">
					<a
						class="btn {archivedView ? 'btn-outline-secondary' : 'btn-secondary'}"
						href={resolve("/sops")}
						aria-current={archivedView ? undefined : "page"}>Active SOPs</a
					>
					<a
						class="btn {archivedView ? 'btn-secondary' : 'btn-outline-secondary'}"
						href={resolve("/sops?archived=1")}
						aria-current={archivedView ? "page" : undefined}>Show archived</a
					>
				</nav>
			{/if}
			<label class="form-label" for="sop-search">Search SOPs</label>
			<input
				id="sop-search"
				class="form-control mb-3"
				type="search"
				placeholder="Try a title or keyword..."
				bind:value={query}
			/>
			<div class="list-group">
				{#each filteredSops as sop (sop.id)}
					<a
						class="list-group-item list-group-item-action {data.selectedSop?.id === sop.id
							? 'active'
							: ''}"
						href={selectedHref(sop.id)}
						onclick={(event) => {
							if (
								event.button === 0 &&
								!event.metaKey &&
								!event.ctrlKey &&
								!event.shiftKey &&
								!event.altKey &&
								event.currentTarget.target !== "_blank" &&
								sop.id !== data.selectedSop?.id
							) {
								editorMode = null;
							}
						}}
					>
						<div class="fw-semibold">
							{sop.title}
							{#if sop.archived}<span class="badge text-bg-secondary ms-1">Archived</span>{/if}
						</div>
						<small class={data.selectedSop?.id === sop.id ? "text-white-50" : "text-muted"}
							>Updated {sop.updatedAt.toLocaleDateString()}</small
						>
					</a>
				{:else}
					<div class="text-muted py-3">No SOPs match that search.</div>
				{/each}
			</div>
		</aside>

		<section class="col-lg-8" aria-label="SOP content">
			{#if isManager && editorMode !== null && (editorMode !== "edit" || (editingSopId !== null && editingSopId === data.selectedSop?.id))}
				<div class="card shadow-sm">
					<div class="card-header d-flex justify-content-between align-items-center">
						<strong>{editorMode === "edit" ? "Edit SOP" : "New SOP"}</strong><button
							class="btn btn-sm btn-outline-secondary"
							type="button"
							onclick={() => (editorMode = null)}>Cancel</button
						>
					</div>
					<div class="card-body">
						<form
							method="post"
							action={editorMode === "edit" ? "?/update" : "?/create"}
							use:enhance={() => {
								const wasCreating = editorMode === "new";
								return async ({ result, update }) => {
									await update();
									if (result.type === "success" && result.data && "id" in result.data) {
										const id = String(result.data.id);
										const destination = wasCreating ? activeHref(id) : selectedHref(id);
										editorMode = null;
										await goto(destination);
									}
								};
							}}
						>
							{#if editorMode === "edit" && editingSopId}<input
									type="hidden"
									name="id"
									value={editingSopId}
								/>{/if}
							<label class="form-label" for="sop-title">Title</label>
							<input
								id="sop-title"
								class="form-control mb-3"
								name="title"
								maxlength="200"
								required
								bind:value={draftTitle}
							/>
							<label class="form-label" for="sop-content">Markdown</label>
							<textarea
								id="sop-content"
								class="form-control sop-editor"
								name="content"
								rows="18"
								required
								bind:value={draftContent}
							></textarea>
							<div class="form-check mt-3">
								<input
									id="sop-share"
									class="form-check-input"
									type="checkbox"
									name="shareWithStudents"
									bind:checked={draftShared}
								/>
								<label class="form-check-label" for="sop-share">Share with students</label>
							</div>
							<div class="d-flex justify-content-between align-items-center mt-3">
								<small class="text-muted"
									>GitHub-flavored Markdown: headings, lists, tables, task lists, links, and code.</small
								><button class="btn btn-primary" type="submit">Save SOP</button>
							</div>
						</form>
						<hr />
						<h2 class="h6">Preview</h2>
						<div class="sop-content"><SvelteMarkdown source={draftContent} /></div>
					</div>
				</div>
			{:else if data.selectedSop}
				<div class="card shadow-sm">
					<div class="card-header d-flex justify-content-between align-items-center">
						<div>
							<h2 class="h4 mb-1">{data.selectedSop.title}</h2>
							<small class="text-muted">Updated {data.selectedSop.updatedAt.toLocaleString()}</small
							>
						</div>
						{#if isManager}<button
								class="btn btn-outline-primary"
								type="button"
								onclick={() => {
									editingSopId = data.selectedSop?.id ?? null;
									draftShared = data.selectedSop?.private === false;
									editorMode = "edit";
								}}>Edit</button
							>{/if}
					</div>
					<div class="card-body sop-content">
						<SvelteMarkdown source={data.selectedSop.content} />
					</div>
					{#if isManager || isStudent}<div
							class="card-footer d-flex justify-content-end flex-wrap gap-2"
						>
							{#if !data.selectedSop.archived}
								<form
									method="post"
									action="?/archive"
									use:enhance={() => {
										return async ({ result, update }) => {
											await update();
											if (result.type === "success") await goto(resolve("/sops"));
										};
									}}
								>
									<input type="hidden" name="id" value={data.selectedSop.id} />
									<button class="btn btn-sm btn-outline-secondary" type="submit">Archive SOP</button
									>
								</form>
							{/if}
							{#if isManager && data.selectedSop.archived}
								<form
									method="post"
									action="?/restore"
									use:enhance={() => {
										return async ({ result, update }) => {
											await update();
											if (result.type === "success") await goto(resolve("/sops"));
										};
									}}
								>
									<input type="hidden" name="id" value={data.selectedSop.id} />
									<button class="btn btn-sm btn-outline-primary" type="submit">Restore SOP</button>
								</form>
							{/if}
							{#if isAdmin}
								<form
									method="post"
									action="?/delete"
									use:enhance={({ cancel }) => {
										if (!confirm("Delete this SOP?")) {
											cancel();
											return;
										}
										return async ({ result, update }) => {
											await update();
											if (result.type === "success") await goto(resolve("/sops"));
										};
									}}
								>
									<input type="hidden" name="id" value={data.selectedSop.id} /><button
										class="btn btn-sm btn-outline-danger"
										type="submit">Delete SOP</button
									>
								</form>
							{/if}
						</div>{/if}
				</div>
			{:else}
				<div class="text-center text-muted border rounded p-5">
					<i class="fa fa-book fa-2x mb-3 d-block"></i>
					<h2 class="h5">Choose an SOP</h2>
					<p class="mb-0">Select a process from the list to view it.</p>
				</div>
			{/if}
		</section>
	</div>
</div>

<style>
	.sop-editor {
		font-family: var(--bs-font-monospace);
	}
	.sop-content :global(h1),
	.sop-content :global(h2),
	.sop-content :global(h3) {
		margin-top: 1.25rem;
	}
	.sop-content :global(p),
	.sop-content :global(ul) {
		line-height: 1.65;
	}
	.sop-content :global(code) {
		background: var(--bs-tertiary-bg);
		padding: 0.1rem 0.3rem;
		border-radius: 0.25rem;
	}
</style>
