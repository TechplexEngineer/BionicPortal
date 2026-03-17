import { sql, eq } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
    const db = locals.db;

    // Fetch students and count of registered parents for each
    const studentsWithParents = await db.select({
        userid: table.students.userid,
        firstName: table.students.firstName,
        lastName: table.students.lastName,
        dietaryRestrictions: table.students.dietaryRestrictions,
        parentEmails: table.students.parentEmails,
        phone: table.students.phone,
        parentPhone: table.students.parentPhone,
        customFields: table.students.customFields,
        hidden: table.students.hidden,
        parentCount: sql<number>`count(${table.parentStudentLinks.parentId})`
    })
        .from(table.students)
        .leftJoin(table.parentStudentLinks, eq(table.students.userid, table.parentStudentLinks.studentId))
        .groupBy(table.students.userid);

    return {
        students: studentsWithParents
    };
}) satisfies PageServerLoad;