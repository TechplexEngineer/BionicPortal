import type { PageServerLoad } from './$types';

import { eventInsertSchema, type EventData } from "$lib/server/db/schema";

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";



export const load = (async ({ locals }) => {

    // // convert Zod schema to JSON Schema (dynamic import so we don't need a top-level import)
    // try {
    //     const { zodToJsonSchema } = await import("zod-to-json-schema");
    //     const jsonSchema = zodToJsonSchema(eventInsertSchema, "EventInsert");
    //     console.log(JSON.stringify(jsonSchema, null, 2));
    // } catch (err) {
    //     console.error("Failed to convert Zod schema to JSON Schema:", err);
    // }

    // const mySchema = z
    //     .object({
    //         myString: z.string().min(5),
    //         myUnion: z.union([z.number(), z.boolean()]),
    //     })
    //     .describe("My neat object schema");

    // const jsonSchema = zodToJsonSchema(mySchema, "mySchema");
    // console.log(JSON.stringify(jsonSchema, null, 2));

    console.log(JSON.stringify(eventInsertSchema, null, 2));

    // const jsonSchema2 = zodToJsonSchema(eventInsertSchema.shape, "mySchema2");
    // console.log(JSON.stringify(jsonSchema2, null, 2));

    // locals.db.query.events
    return {
        events: []
    };
}) satisfies PageServerLoad;