import type { Page } from "./DashHeader.svelte";

export const isActiveParentRoute = (route: string, currentRoute: string, routes: Page[]) => {
    // console.log("isActiveParentRoute check:", { route, currentRoute });

    if (currentRoute === route) return true;
    const parentRoutes = routes.map((pg) => pg.route);
    const overlap = parentRoutes.filter((parent) => {
        // console.log("   parent:", parent, "check:", route, currentRoute.startsWith(parent) && parent.length >= route.length)
        return currentRoute.startsWith(parent);// && parent.length <= route.length

    });
    const longestPrefix = overlap
        .sort((a, b) => b.length - a.length);
    return (longestPrefix[0] && longestPrefix[0] === route) ?? false;
};

export const getParentRoute = (currentRoute: string, routes: Page[]) => {
    const parentRoutes = routes.map((pg) => pg.route);
    const overlap = parentRoutes.filter((parent) => currentRoute.startsWith(parent));
    const longestPrefix = overlap
        .sort((a, b) => b.length - a.length);
    return longestPrefix[0] ?? null;
}
