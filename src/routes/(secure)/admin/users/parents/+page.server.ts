import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	const db = event.locals.db;

	const parents = await db
		.select({
			id: table.user.id,
			username: table.user.username
		})
		.from(table.user)
		.where(eq(table.user.role, "parent"));

	const links = await db
		.select({
			parentId: table.parentStudentLinks.parentId,
			studentId: table.parentStudentLinks.studentId,
			studentFirstName: table.students.firstName,
			studentLastName: table.students.lastName
		})
		.from(table.parentStudentLinks)
		.innerJoin(table.students, eq(table.parentStudentLinks.studentId, table.students.userid));

	const parentsWithStudents = parents.map((parent) => ({
		...parent,
		students: links.filter((link) => link.parentId === parent.id)
	}));

	return {
		parents: parentsWithStudents
	};
};
