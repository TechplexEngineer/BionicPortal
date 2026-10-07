const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const CONTENT_TYPES = new Map([
	["application/pdf", "pdf"],
	["image/jpeg", "jpg"],
	["image/png", "png"],
	["image/webp", "webp"]
]);

export async function storeFormUpload(bucket: R2Bucket, keyPrefix: string, file: File) {
	if (!file || file.size === 0) throw new Error("Choose a file to upload.");
	if (file.size > MAX_UPLOAD_BYTES) throw new Error("Uploads must be 10 MB or smaller.");
	const extension = CONTENT_TYPES.get(file.type);
	if (!extension) throw new Error("Upload a PDF, JPEG, PNG, or WebP file.");

	const key = `${keyPrefix}.${extension}`;
	await bucket.put(key, new Uint8Array(await file.arrayBuffer()), {
		httpMetadata: { contentType: file.type }
	});
	return key;
}
