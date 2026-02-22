import { fail, redirect } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";
import { getDb } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";
import { eq, and, gt } from "drizzle-orm";
import { sendMagicCode } from "$lib/server/brevo";
import { env } from "$env/dynamic/private";

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, "/dashboard");
	}
	return {};
};

export const actions: Actions = {
	requestCode: async (event) => {
		const formData = await event.request.formData();
		const rawEmail = formData.get("email");

		if (typeof rawEmail !== "string" || !rawEmail.includes("@")) {
			return fail(400, { message: "Invalid email address" });
		}

		const email = rawEmail.toLowerCase().trim();

		// Generate a 6-digit code
		const code = Math.floor(100000 + Math.random() * 900000).toString();
		// 15 minutes in the future
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

		console.log(`[requestCode] email: ${email}, code: ${code}, expires: ${expiresAt.toISOString()}`);

		const db = getDb(event.platform);

		try {
			// Upsert the code
			await db.insert(table.magicCodes)
				.values({ email, code, expiresAt })
				.onConflictDoUpdate({
					target: table.magicCodes.email,
					set: { code, expiresAt }
				});

			if (env.BREVO_API_KEY) {
				await sendMagicCode(email, code, env.BREVO_API_KEY);
			} else {
				console.log(`[requestCode] Bypassing email send (no BREVO_API_KEY). CODE FOR ${email} IS: ${code}`);
			}

			return { success: true, email, message: "Code sent! Please check your email." };
		} catch (e) {
			console.error("[requestCode] Error:", e);
			return fail(500, { message: "Failed to send code. Please try again later." });
		}
	},
	loginWithCode: async (event) => {
		const formData = await event.request.formData();
		const rawEmail = formData.get("email");
		const code = formData.get("code");

		if (typeof rawEmail !== "string" || typeof code !== "string") {
			return fail(400, { message: "Invalid request" });
		}

		const email = rawEmail.toLowerCase().trim();
		const trimmedCode = code.trim();

		console.log(`[loginWithCode] verifying code for: "${email}", code: "${trimmedCode}"`);

		const db = getDb(event.platform);

		// Debug: check what's in the DB for this email
		const entries = await db.select().from(table.magicCodes).where(eq(table.magicCodes.email, email));
		console.log(`[loginWithCode] DB entries for "${email}":`, JSON.stringify(entries));

		// Verify the code
		const [validCode] = await db.select()
			.from(table.magicCodes)
			.where(and(
				eq(table.magicCodes.email, email),
				eq(table.magicCodes.code, trimmedCode),
				gt(table.magicCodes.expiresAt, new Date())
			));

		if (!validCode) {
			const now = new Date();
			console.warn(`[loginWithCode] Verification failed for "${email}". Code: "${trimmedCode}". Current time: ${now.toISOString()}`);
			return fail(400, { message: "Invalid or expired code" });
		}

		console.log(`[loginWithCode] Code verified successfully for ${email}`);

		// Check if user exists, if not create one
		let [existingUser] = await db.select().from(table.user).where(eq(table.user.username, email));

		if (!existingUser) {
			console.log(`[loginWithCode] Creating new user for ${email}`);
			const userId = crypto.randomUUID();
			await db.insert(table.user).values({
				id: userId,
				username: email,
				passwordHash: "MAGIC_LINK_ONLY",
				role: "user"
			});
			[existingUser] = await db.select().from(table.user).where(eq(table.user.id, userId));
		}

		// Create session
		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser.id, db);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		console.log(`[loginWithCode] Session created for ${email}. Redirecting to dashboard.`);
		return redirect(302, "/dashboard");
	}
};
