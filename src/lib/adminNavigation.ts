import type { Page } from "$lib/components/DashHeader.svelte";

export const adminNavPages: Page[] = [
	{
		name: "Dashboard",
		route: "/admin",
		nested: [
			{
				name: "Overview",
				route: "/admin"
			}
		]
	},
	{
		name: "Students",
		route: "/admin/students",
		nested: [
			{
				name: "Overview",
				route: "/admin/students"
			},
			{
				name: "Import",
				route: "/admin/students/import"
			},
			{
				name: "Attendance",
				route: "/admin/students/attendance"
			}
		]
	},
	{
		name: "Parents",
		route: "/admin/parents",
		nested: [
			{
				name: "Overview",
				route: "/admin/parents"
			}
		]
	},
	{
		name: "Users",
		route: "/admin/users",
		nested: [
			{
				name: "Overview",
				route: "/admin/users"
			},
			{
				name: "Create User",
				route: "/admin/users/new"
			}
		]
	},
	{
		name: "Events",
		route: "/admin/events",
		nested: [
			{
				name: "Overview",
				route: "/admin/events"
			},
			{
				name: "Add Event",
				route: "/admin/events/add"
			},
			{
				name: "Import Events",
				route: "/admin/events/import"
			},
			{
				name: "Carpools",
				route: "/admin/events/carpools"
			}
		]
	},
	{
		name: "Forms",
		route: "/admin/forms",
		nested: [
			{ name: "Overview", route: "/admin/forms" },
			{ name: "Create Form", route: "/admin/forms/new" }
		]
	},
	{
		name: "Shop",
		route: "/admin/shop",
		nested: [
			{
				name: "Locations",
				route: "/admin/shop"
			}
		]
	},
	{
		name: "SOPs",
		route: "/sops",
		nested: [
			{
				name: "Overview",
				route: "/sops"
			}
		]
	}
];
