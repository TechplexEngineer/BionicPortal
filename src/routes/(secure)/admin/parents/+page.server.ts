import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    const db = event.locals.db;

    // Fetch all users with role 'parent'
    const parents = await db.select()
        .from(table.user)
        .where(eq(table.user.role, "parent"));

    // Fetch all links to students
    const links = await db.select({
        parentId: table.parentStudentLinks.parentId,
        studentId: table.parentStudentLinks.studentId,
        studentFirstName: table.students.firstName,
        studentLastName: table.students.lastName,
    })
        .from(table.parentStudentLinks)
        .innerJoin(table.students, eq(table.parentStudentLinks.studentId, table.students.userid));

    // Group links by parent
    const parentsWithStudents = parents.map(parent => ({
        ...parent,
        students: links.filter(link => link.parentId === parent.id)
    }));

    return {
        parents: parentsWithStudents
    };
};
