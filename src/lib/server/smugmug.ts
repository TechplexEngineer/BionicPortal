import crypto from "node:crypto";

export interface SmugmugAlbumResult {
	albumUrl: string;
	uploadUrl: string;
	albumKey: string;
}

function generateNonce(): string {
	return crypto.randomBytes(16).toString("hex");
}

function generateTimestamp(): string {
	return Math.floor(Date.now() / 1000).toString();
}

function percentEncode(str: string): string {
	return encodeURIComponent(str)
		.replace(/!/g, "%21")
		.replace(/\*/g, "%2A")
		.replace(/'/g, "%27")
		.replace(/\(/g, "%28")
		.replace(/\)/g, "%29");
}

function buildOAuthHeader(
	method: string,
	url: string,
	consumerKey: string,
	consumerSecret: string,
	accessToken: string,
	accessTokenSecret: string
): string {
	const oauthParams: Record<string, string> = {
		oauth_consumer_key: consumerKey,
		oauth_nonce: generateNonce(),
		oauth_signature_method: "HMAC-SHA1",
		oauth_timestamp: generateTimestamp(),
		oauth_token: accessToken,
		oauth_version: "1.0"
	};

	const sortedParams = Object.keys(oauthParams)
		.sort()
		.map((key) => `${percentEncode(key)}=${percentEncode(oauthParams[key])}`)
		.join("&");

	const signatureBase = [
		method.toUpperCase(),
		percentEncode(url),
		percentEncode(sortedParams)
	].join("&");

	const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`;

	const hmac = crypto.createHmac("sha1", signingKey);
	hmac.update(signatureBase);
	const signature = hmac.digest("base64");

	const headerParams: Record<string, string> = { ...oauthParams, oauth_signature: signature };
	const headerParts = Object.keys(headerParams)
		.sort()
		.map((key) => `${percentEncode(key)}="${percentEncode(headerParams[key])}"`)
		.join(", ");

	return `OAuth ${headerParts}`;
}

export async function createSmugmugAlbum(
	eventName: string,
	platform: App.Platform
): Promise<SmugmugAlbumResult | null> {
	const {
		SMUGMUG_API_KEY,
		SMUGMUG_API_SECRET,
		SMUGMUG_ACCESS_TOKEN,
		SMUGMUG_ACCESS_TOKEN_SECRET,
		SMUGMUG_NICKNAME
	} = platform.env;

	if (
		!SMUGMUG_API_KEY ||
		!SMUGMUG_API_SECRET ||
		!SMUGMUG_ACCESS_TOKEN ||
		!SMUGMUG_ACCESS_TOKEN_SECRET ||
		!SMUGMUG_NICKNAME
	) {
		console.warn("SmugMug credentials not configured, skipping album creation");
		return null;
	}

	const url = `https://api.smugmug.com/api/v2/folder/user/${SMUGMUG_NICKNAME}!albums`;

	const body = JSON.stringify({
		Name: eventName,
		Privacy: "Public",
		SmugSearchable: "No",
		WorldSearchable: "No"
	});

	const authHeader = buildOAuthHeader(
		"POST",
		url,
		SMUGMUG_API_KEY,
		SMUGMUG_API_SECRET,
		SMUGMUG_ACCESS_TOKEN,
		SMUGMUG_ACCESS_TOKEN_SECRET
	);

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: authHeader,
				"Content-Type": "application/json",
				Accept: "application/json"
			},
			body
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("SmugMug API error:", response.status, errorText);
			return null;
		}

		const data = (await response.json()) as {
			Response: {
				Album: {
					WebUri: string;
					AlbumKey: string;
					UploadKey: string;
				};
			};
		};

		const album = data.Response.Album;
		const uploadUrl = `https://www.smugmug.com/gallery/n-${album.AlbumKey}/upload/${album.UploadKey}`;

		return {
			albumUrl: album.WebUri,
			uploadUrl,
			albumKey: album.AlbumKey
		};
	} catch (err) {
		console.error("Failed to create SmugMug album:", err);
		return null;
	}
}
