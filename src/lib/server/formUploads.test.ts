import { describe, expect, it, vi } from "vitest";
import { storeFormUpload } from "./formUploads";

function file(name: string, type: string, size: number) {
	return new File([new Uint8Array(size)], name, { type });
}

describe("storeFormUpload", () => {
	it("stores an accepted PDF with its content type", async () => {
		const bucket = { put: vi.fn().mockResolvedValue(undefined) };
		const key = await storeFormUpload(
			bucket as never,
			"forms/form-1/assignment-1",
			file("scan.pdf", "application/pdf", 4)
		);

		expect(key).toBe("forms/form-1/assignment-1.pdf");
		expect(bucket.put).toHaveBeenCalledWith(
			"forms/form-1/assignment-1.pdf",
			expect.any(Uint8Array),
			{ httpMetadata: { contentType: "application/pdf" } }
		);
	});

	it("rejects unsupported file types", async () => {
		await expect(
			storeFormUpload(
				{ put: vi.fn() } as never,
				"forms/form-1/assignment-1",
				file("scan.txt", "text/plain", 4)
			)
		).rejects.toThrow("PDF, JPEG, PNG, or WebP");
	});

	it("rejects files larger than 10 MiB", async () => {
		await expect(
			storeFormUpload(
				{ put: vi.fn() } as never,
				"forms/form-1/assignment-1",
				file("scan.pdf", "application/pdf", 10 * 1024 * 1024 + 1)
			)
		).rejects.toThrow("10 MB");
	});
});
