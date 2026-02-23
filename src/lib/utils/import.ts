export interface ImportField {
    name: string;
    label: string;
    searchTerms: string[];
    required?: boolean;
}

export function autoMap(fileHeaders: string[], fields: ImportField[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const normalizedHeaders = fileHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

    fields.forEach((field) => {
        const index = normalizedHeaders.findIndex((h) =>
            field.searchTerms.some((term) => h.includes(term.toLowerCase()))
        );
        if (index !== -1) {
            mapping[field.name] = fileHeaders[index];
        } else {
            mapping[field.name] = "";
        }
    });

    return mapping;
}
