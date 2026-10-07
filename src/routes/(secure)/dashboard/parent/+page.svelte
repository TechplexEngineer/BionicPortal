<script lang="ts">
	import type { PageProps } from "./$types";
	import { hasPendingActionItems } from "$lib/profileActions";
	let { data }: PageProps = $props();
</script>

<svelte:head><title>Parent Dashboard | Bionic Portal</title></svelte:head>
<div class="container py-4">
	<div class="d-flex justify-content-between align-items-center mb-4">
		<div>
			<h1 class="mb-1">Parent Dashboard</h1>
			<p class="text-body-secondary mb-0">Manage your student connections and forms.</p>
		</div>
		<a class="btn btn-outline-primary" href="/register/parent">Link another student</a>
	</div>
	<div class="card border-0 shadow-sm mb-4">
		<div class="card-body">
			<h2 class="h5 mb-3">Your next steps</h2>
			<div class="row g-3">
				<div class="col-md-4">
					<div class="d-flex gap-2">
						<span class="badge rounded-pill bg-success align-self-start">1</span>
						<div>
							<strong>Parent account</strong>
							<div class="small text-success">Complete</div>
						</div>
					</div>
				</div>
				<div class="col-md-4">
					<div class="d-flex gap-2">
						<span class="badge rounded-pill bg-success align-self-start">2</span>
						<div>
							<strong>Student connection</strong>
							<div class="small text-success">Connected students appear below</div>
						</div>
					</div>
				</div>
				<div class="col-md-4">
					<div class="d-flex gap-2">
						<span class="badge rounded-pill bg-primary align-self-start">3</span>
						<div>
							<strong>Forms</strong>
							<div class="small text-body-secondary">Complete any forms listed in Action Items</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="card shadow-sm">
		<div class="card-header bg-warning bg-opacity-10">
			<h2 class="h4 mb-0">
				<i class="fa fa-list-check text-warning me-2"></i>Action Items
			</h2>
		</div>
		<div class="card-body">
			{#if data.profileCompleteness.incomplete}
				<a
					href={`${data.profileCompleteness.href}?returnTo=${encodeURIComponent("/dashboard/parent")}`}
					class="alert alert-danger d-block text-decoration-none"
				>
					<i class="fa fa-user me-2"></i>
					<strong>Complete your profile</strong>
					<div class="small mt-1">Missing: {data.profileCompleteness.missingFields.join(", ")}</div>
				</a>
			{/if}
			{#if !hasPendingActionItems(data.profileCompleteness.incomplete, data.tasks.length + data.standaloneTasks.length)}
				<div class="alert alert-success mb-0">
					<strong>You’re all set.</strong> There are no forms waiting for your signature.
				</div>
			{:else}
				<h3 class="h5">Forms waiting for you</h3>
				<p class="text-body-secondary">
					Open a form, review the information, complete the required parent fields, and select “Sign
					and submit.”
				</p>
				<div class="list-group">
					{#each data.tasks as task (task.inviteId)}
						<a
							class="list-group-item list-group-item-action"
							href="/dashboard/parent/forms/{task.inviteId}"
						>
							<div class="d-flex justify-content-between gap-3">
								<strong>{task.formName}</strong><span class="text-nowrap">{task.studentName}</span>
							</div>
							<small class="text-muted">{task.eventName} · Select to review and submit</small>
						</a>
					{/each}
					{#each data.standaloneTasks as task (task.assignmentId)}
						<a
							class="list-group-item list-group-item-action"
							href="/dashboard/parent/standalone-forms/{task.assignmentId}"
						>
							<div class="d-flex justify-content-between gap-3">
								<strong>{task.formName}</strong><span class="text-nowrap">{task.studentName}</span>
							</div>
							<small class="text-muted">Assigned form · Select to review and submit</small>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
