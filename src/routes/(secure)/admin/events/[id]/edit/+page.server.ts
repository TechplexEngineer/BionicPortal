import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import { getDb } from "$lib/server/db";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    const db = getDb(event.platform);
    const id = event.params.id;

    const [eventData] = await db.select()
        .from(table.events)
        .where(eq(table.events.id, id));

    if (!eventData) {
        throw redirect(302, "/admin/events");
    }

    return {
        event: {
            id: eventData.id,
            ...eventData.data
        }
    };
};

export const actions: Actions = {
    default: async (event) => {
        const formData = await event.request.formData();
        const id = event.params.id;
        const name = formData.get("name") as string;
        const startDate = formData.get("startDate") as string;
        const endDate = formData.get("endDate") as string;
        const location = formData.get("location") as string;
        const isOvernight = formData.get("isOvernight") === "on";
        const departureTime = formData.get("departureTime") as string;
        const returnTime = formData.get("returnTime") as string;
        const description = formData.get("description") as string;
        const hotelAddress = formData.get("hotelAddress") as string;

        if (!name || !startDate || !endDate || !location) {
            return fail(400, { message: "Missing required fields" });
        }

        const db = getDb(event.platform);

        try {
            await db.update(table.events)
                .set({
                    data: {
                        name,
                        startDate,
                        endDate,
                        location,
                        isOvernight,
                        departureTime,
                        returnTime,
                        description,
                        hotelAddress
                    }
                })
                .where(eq(table.events.id, id));
        } catch (e) {
            console.error("Failed to update event:", e);
            return fail(500, { message: "Failed to update event" });
        }

        throw redirect(303, "/admin/events");
    }
};
