<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";

	let { form }: { form: ActionData } = $props();
</script>

<div class="container">
	<h1>Add User</h1>

	{#if form?.message}
		<div class="alert alert-error" style="color: red; margin-bottom: 1rem;">
			{form.message}
		</div>
	{/if}

	<form method="POST" use:enhance style="max-width: 400px;">
		<div style="margin-bottom: 1rem;">
			<label for="email" style="display: block; margin-bottom: 0.5rem;">Email (Username)</label>
			<input 
				type="email" 
				id="email" 
				name="email" 
				required 
				style="width: 100%; padding: 0.5rem;"
			/>
		</div>

		<div style="margin-bottom: 1.5rem;">
			<label for="role" style="display: block; margin-bottom: 0.5rem;">Role</label>
			<select 
				id="role" 
				name="role" 
				required 
				style="width: 100%; padding: 0.5rem;"
			>
				<option value="user">User</option>
				<option value="admin">Admin</option>
				<option value="mentor">Mentor</option>
			</select>
		</div>

		<button type="submit" class="btn btn-primary">Create User</button>
		<a href="/admin/users" class="btn" style="margin-left: 1rem;">Cancel</a>
	</form>
</div>
