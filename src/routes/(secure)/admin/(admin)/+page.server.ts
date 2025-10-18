import type { PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import * as schema from "$lib/server/db/schema";

export const load = (async ({ locals }) => {
	return {};
}) satisfies PageServerLoad;


