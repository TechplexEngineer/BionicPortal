<script lang="ts">
	import DashHeader, { type Page } from '$lib/components/DashHeader.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const navPages: Page[] = [
		{
			name: 'Dashboard',
			route: '/admin',
			nested: [
				{
					name: 'Overview',
					route: '/admin'
				}
			]
		},
		{
			name: 'Students',
			route: '/admin/students',
			nested: [
				{
					name: 'Overview',
					route: '/admin/students'
				},
				{
					name: 'Import',
					route: '/admin/students/import'
				},
				{
					name: 'Attendance',
					route: '/admin/students/attendance'
				}
			]
		}
	];
</script>

<div class="container">
	<DashHeader pages={navPages} />
</div>
{@render children()}
