/**
 * Converts an uploaded File to a base64-encoded data URL for database storage.
 * Uses chunked processing to handle larger files safely.
 */
export async function fileToDataUrl(file: File): Promise<string> {
	const buffer = await file.arrayBuffer();
	const bytes = new Uint8Array(buffer);
	const chunkSize = 8192;
	const chunks: string[] = [];
	for (let i = 0; i < bytes.length; i += chunkSize) {
		chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
	}
	const base64 = btoa(chunks.join(""));
	return `data:${file.type};base64,${base64}`;
}
