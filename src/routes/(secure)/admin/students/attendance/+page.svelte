<script lang="ts">
	import TableForObjectArray, {
		type TableColumns
	} from "$lib/components/TableForObjectArray.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();

	console.log("data", data);

	const columns: TableColumns = [
		{ data: "first", title: "First" },
		{ data: "last", title: "Last" },
		{ data: "total", title: "Total" },
		{ data: "percent", title: "Percentage" }
	];

	for (const meeting of data.meetings) {
		columns.push({
			data: meeting.date,
			title: meeting.date
		});
	}
	// columns.push({
	// 	data: "email",
	// 	title: "Actions"
	// });
</script>

<div class="container">
	<h1>Student Attendance</h1>

	<TableForObjectArray data={data.attend} {columns} />
</div>
