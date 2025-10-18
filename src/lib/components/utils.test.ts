import { describe, it, expect } from "vitest";
import { getParentRoute, isActiveParentRoute } from "./utils";
import type { Page } from "./DashHeader.svelte";

const navPages: Page[] = [
    {
        name: 'Dashboard',
        route: '/admin',
        nested: [
            {
                name: 'Overview',
                route: '/admin'
            }
        ]
    },
    {
        name: 'Students',
        route: '/admin/students',
        nested: [
            {
                name: 'Overview',
                route: '/admin/students'
            },
            {
                name: 'Import',
                route: '/admin/students/import'
            },
            {
                name: 'Attendance',
                route: '/admin/students/attendance'
            }
        ]
    }
];

describe("isActiveParentRoute", () => {
    // it("returns true when current route matches parent route exactly", () => {
    //     expect(isActiveParentRoute("/admin", "/admin", navPages)).toBe(true);
    // });

    // it("returns true when current route is a child of parent route", () => {
    //     expect(isActiveParentRoute("/admin", "/admin/students", navPages)).toBe(true);
    // });

    // it("returns false when current route does not match parent route", () => {
    //     expect(isActiveParentRoute("/dashboard", "/profile", navPages)).toBe(false);
    //     expect(isActiveParentRoute("/admin", "/dashboard", navPages)).toBe(false);
    // });

    // it("returns false when parent route is empty", () => {
    //     expect(isActiveParentRoute("", "/dashboard", navPages)).toBe(false);
    // });

    // it("returns false when current route is empty", () => {
    //     expect(isActiveParentRoute("/dashboard", "", navPages)).toBe(false);
    // });

    // it("returns true for nested routes", () => {
    //     expect(isActiveParentRoute("/admin", "/admin/students/import", navPages)).toBe(true);
    // });

    // it('', () => {
    //     expect(isActiveParentRoute("/admin/students", "/admin/students/import", navPages)).toBe(true);
    // })

    it('works for dashboard page', () => {
        //check, current
        expect(isActiveParentRoute("/admin", "/admin", navPages)).toBe(true);
        expect(isActiveParentRoute("/admin/students", "/admin", navPages)).toBe(false);
    })

    it('works for students page', () => {
        //check, current
        expect(isActiveParentRoute("/admin", "/admin/students", navPages)).toBe(false);
        expect(isActiveParentRoute("/admin/students", "/admin/students", navPages)).toBe(true);
    })

    // it("returns false for similar but non-nested routes", () => {
    //     expect(isActiveParentRoute("/admin", "/admining", navPages)).toBe(false);
    // });
});

describe("getParentRoute", () => {
    it('works', () => {
        //check, current
        expect(getParentRoute("/admin", navPages)).toBe("/admin");
        expect(getParentRoute("/admin/students", navPages)).toBe("/admin/students");
        expect(getParentRoute("/admin/students/import", navPages)).toBe("/admin/students");

    })
})