import type { LayoutServerLoad } from "./$types";
export const load: LayoutServerLoad = async (request) => {
	return {
		user: await request.locals.user,
		isImpersonating: request.locals.isImpersonating
	};
};
