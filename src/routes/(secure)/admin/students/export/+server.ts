import { and, eq, isNull, ne, or } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, url }) => {
	const showArchived = url.searchParams.get("showArchived") === "true";
	const lastYear = String(new Date().getFullYear() - 1);
	const rows = await locals.db
		.select({
			firstName: table.students.firstName,
			lastName: table.students.lastName
		})
		.from(table.students)
		.where(
			showArchived
				? undefined
				: and(
						eq(table.students.hidden, false),
						or(
							isNull(table.students.graduationYear),
							eq(table.students.graduationYear, ""),
							ne(table.students.graduationYear, lastYear)
						)
					)
		)
		.orderBy(table.students.lastName, table.students.firstName);

	const csv = [
		["First Name", "Last Name"].map(csvValue).join(","),
		...rows.map((row) => [row.firstName, row.lastName].map(csvValue).join(","))
	].join("\r\n");

	return new Response(csv, {
		headers: {
			"content-type": "text/csv; charset=utf-8",
			"content-disposition": 'attachment; filename="students.csv"'
		}
	});
};

function csvValue(value: string) {
	return `"${value.replaceAll('"', '""')}"`;
}
