<script lang="ts">
	import type { PageProps } from "./$types";

	let { data, form }: PageProps = $props();
</script>

<div class="container">
	<div class="d-flex justify-content-between align-items-center mb-3">
		<h1>Create User</h1>
		<a href="/admin/users" class="btn btn-secondary">Back to Users</a>
	</div>

	{#if form?.message}
		<div class="alert alert-danger">{form.message}</div>
	{/if}

	<form method="POST" action="?/create">
		<div class="mb-3">
			<label for="username" class="form-label">Username</label>
			<input
				type="text"
				id="username"
				name="username"
				class="form-control"
				value={form?.username ?? ""}
				minlength="3"
				maxlength="63"
				required
			/>
		</div>

		<div class="mb-3">
			<label for="role" class="form-label">Role</label>
			<select id="role" name="role" class="form-select">
				{#each data.roles as role}
					<option value={role} selected={role === "user"}>
						{role.charAt(0).toUpperCase() + role.slice(1)}
					</option>
				{/each}
			</select>
		</div>

		<div class="mb-3">
			<label for="password" class="form-label">Password</label>
			<input
				type="password"
				id="password"
				name="password"
				class="form-control"
				minlength="6"
				maxlength="255"
				required
			/>
		</div>

		<button type="submit" class="btn btn-success">Create User</button>
	</form>
</div>
