import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load = (async ({ locals }) => {
	const students = await locals.db.query.students.findMany({
		where: (students, { eq }) => eq(students.hidden, false),
		orderBy: (students, { asc }) => [asc(students.lastName), asc(students.firstName)]
	});
	const contacts = await locals.db.query.contacts.findMany({
		orderBy: (contacts, { asc }) => [asc(contacts.type), asc(contacts.name)]
	});

	return { students, contacts };
}) satisfies PageServerLoad;

const FROM_ADDRESS = "noreply@team4909.org";

function buildMimeMessage(from: string, to: string, subject: string, body: string): string {
	return [
		`From: ${from}`,
		`To: ${to}`,
		`Subject: ${subject}`,
		`Content-Type: text/plain; charset=UTF-8`,
		``,
		body
	].join("\r\n");
}

export const actions: Actions = {
	send: async ({ request, locals, platform }) => {
		const formData = await request.formData();
		const subject = (formData.get("subject") as string)?.trim();
		const body = (formData.get("body") as string)?.trim();
		const groups = formData.getAll("groups") as string[];

		if (!subject) {
			return fail(400, { error: "Subject is required" });
		}
		if (!body) {
			return fail(400, { error: "Body is required" });
		}
		if (!groups.length) {
			return fail(400, { error: "Select at least one recipient group" });
		}

		// Gather recipient emails
		const recipients: string[] = [];

		if (groups.includes("students")) {
			const students = await locals.db.query.students.findMany({
				where: (students, { eq }) => eq(students.hidden, false)
			});
			for (const s of students) {
				recipients.push(s.userid);
			}
		}

		const contactTypes = groups.filter((g) => ["parent", "sponsor", "mentor"].includes(g));
		if (contactTypes.length > 0) {
			const allContacts = await locals.db.query.contacts.findMany();
			for (const c of allContacts) {
				if (contactTypes.includes(c.type)) {
					recipients.push(c.email);
				}
			}
		}

		// Deduplicate
		const uniqueRecipients = [...new Set(recipients)];

		if (uniqueRecipients.length === 0) {
			return fail(400, { error: "No recipients found for the selected groups" });
		}

		const sendEmail = platform?.env?.SEND_EMAIL;
		if (!sendEmail) {
			return fail(500, { error: "Email service is not configured" });
		}

		// Dynamic import so Node.js build does not attempt to load the cloudflare: scheme
		const { EmailMessage } = await import(/* @vite-ignore */ "cloudflare:email");

		const fromAddress = FROM_ADDRESS;
		let sent = 0;
		const errors: string[] = [];

		for (const to of uniqueRecipients) {
			try {
				const raw = buildMimeMessage(fromAddress, to, subject, body);
				const message = new EmailMessage(fromAddress, to, raw);
				await sendEmail.send(message);
				sent++;
			} catch (err) {
				errors.push(to);
				console.error(`Failed to send email to ${to}:`, err);
			}
		}

		if (errors.length > 0) {
			return {
				success: true,
				sent,
				errors,
				message: `Sent ${sent} email(s). Failed to send to: ${errors.join(", ")}`
			};
		}

		return { success: true, sent, errors: [], message: `Successfully sent ${sent} email(s)` };
	}
};
