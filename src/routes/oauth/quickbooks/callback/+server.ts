import { redirect } from "@sveltejs/kit";
import { exchangeCodeForToken } from "$lib/server/quickbooks";
import { getDb } from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
    const code = event.url.searchParams.get("code");
    const realmId = event.url.searchParams.get("realmId");
    const state = event.url.searchParams.get("state");

    if (!code || !realmId) {
        return new Response("Missing code or realmId", { status: 400 });
    }

    const db = getDb(event.platform);
    await exchangeCodeForToken(code, realmId, db);

    const returnUrl = event.cookies.get("qb_return_url") || "/admin/events";
    event.cookies.delete("qb_return_url", { path: "/" });

    throw redirect(302, returnUrl);
};
