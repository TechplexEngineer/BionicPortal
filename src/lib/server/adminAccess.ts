type User = App.Locals["user"];

export function canAccessAdmin(user: User) {
	return user?.role === "admin" || user?.role === "mentor";
}

export function canWriteAdmin(user: User) {
	return user?.role === "admin";
}

export function canWriteAdminRequest(pathname: string, method: string, user: User) {
	return !pathname.startsWith("/admin") || method === "GET" || canWriteAdmin(user);
}
