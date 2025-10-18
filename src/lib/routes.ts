

export const getAllRoutes1 = async () => {
    const modules = import.meta.glob('/src/routes/**/*.svelte');
    const routes = [];

    for (const path in modules) {
        // Extract the route path from the file path
        // e.g., /src/routes/about/+page.svelte -> /about
        // e.g., /src/routes/+page.svelte -> /
        let routePath = path
            .replace('/src/routes', '')
            .replace('/+page.svelte', '')
            .replace('/+error.svelte', '') // Exclude error pages if desired
            .replace('/+layout.svelte', ''); // Exclude layouts if desired

        // Handle the root route
        if (routePath === '') {
            routePath = '/';
        }

        // Handle dynamic routes (e.g., [slug])
        routePath = routePath.replace(/\[(\w+)\]/g, ':$1');

        routes.push(routePath);
    }

    return routes;
};