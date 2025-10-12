import { getRequestEvent } from "$app/server";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

function requireLogin() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		return redirect(302, "/login");
	}

	if (locals.user.role != "admin") {
		return redirect(302, "/login");
	}

	return locals.user;
}
export const load: LayoutServerLoad = async (request) => {
	const user = requireLogin();
	return {
		user
	};
};
