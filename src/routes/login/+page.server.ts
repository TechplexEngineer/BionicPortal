import { encodeBase32LowerCase } from "@oslojs/encoding";
import { fail, redirect } from "@sveltejs/kit";
import { eq, and, gt } from "drizzle-orm";
import * as auth from "$lib/server/auth";
import { getDb } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";
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
		const email = formData.get("email");

		if (typeof email !== "string" || !email.includes("@")) {
			return fail(400, { message: "Invalid email address" });
		}

		// Generate a 6-digit code
		const code = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

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
				console.log(`Bypassing email send (no BREVO_API_KEY). Code for ${email} is: ${code}`);
			}

			return { success: true, email, message: "Code sent! Please check your email." };
		} catch (e) {
			console.error("Failed to request code:", e);
			return fail(500, { message: "Failed to send code. Please try again later." });
		}
	},
	loginWithCode: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get("email");
		const code = formData.get("code");

		if (typeof email !== "string" || typeof code !== "string") {
			return fail(400, { message: "Invalid request" });
		}

		const db = getDb(event.platform);

		// Verify the code
		const [validCode] = await db.select()
			.from(table.magicCodes)
			.where(and(
				eq(table.magicCodes.email, email),
				eq(table.magicCodes.code, code),
				gt(table.magicCodes.expiresAt, new Date())
			));

		if (!validCode) {
			return fail(400, { message: "Invalid or expired code" });
		}

		// Check if user exists, if not create one
		let [existingUser] = await db.select().from(table.user).where(eq(table.user.username, email));

		if (!existingUser) {
			const userId = generateUserId();
			// For magic link users, we don't have a password block. 
			// We'll set a dummy password hash or handle it in the schema later if needed.
			await db.insert(table.user).values({
				id: userId,
				username: email,
				passwordHash: "MAGIC_LINK_ONLY",
				role: "user"
			});
			[existingUser] = await db.select().from(table.user).where(eq(table.user.id, userId));
		}

		// Delete the code after use
		await db.delete(table.magicCodes).where(eq(table.magicCodes.email, email));

		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser.id, db);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return redirect(302, "/dashboard");
	}
};

function generateUserId() {
	// ID with 120 bits of entropy, or about the same as UUID v4.
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	const id = encodeBase32LowerCase(bytes);
	return id;
}

function validateUsername(username: unknown): username is string {
	if (typeof username !== "string") {
		return false;
	}
	return username.length >= 3 && username.length <= 63;
}

function validatePassword(password: unknown): password is string {
	return typeof password === "string" && password.length >= 6 && password.length <= 255;
}
