import { Context } from 'hono';

export async function loadImage(c: Context, imagePath: string): Promise<string | null> {
	try {
		const isRemote = imagePath.startsWith('http://') || imagePath.startsWith('https://');
		if (isRemote) {
			console.log('Loading remote image from:', imagePath);
			const cache = caches.default;
			const cacheKey = new Request(imagePath, { method: 'GET' });
			let res = await cache.match(cacheKey);
			if (!res) {
				res = await fetch(imagePath);
				if (!res.ok) throw new Error(`Remote fetch failed: ${res.status}`);
				await cache.put(cacheKey, res.clone());
			}
			const contentType = res.headers.get('content-type') ?? 'image/png';
			const buffer = await res.arrayBuffer();
			return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
		}

		if (!c.env?.ASSETS) throw new Error('ASSETS binding not configured');

		// Strip leading slash → `/images/dark-banner.png` → `images/dark-banner.png`
		const key = imagePath.replace(/^\//, '');
		const assetRes = await c.env.ASSETS.fetch(`https://example.com/${key}`);

		if (!assetRes.ok) throw new Error(`Asset fetch failed: ${assetRes.status}`);

		const contentType = assetRes.headers.get('content-type') ?? 'image/png';
		const arrayBuffer = await assetRes.arrayBuffer();
		return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
	} catch (err) {
		console.warn(`⚠️ Failed to load image "${imagePath}":`, err);
		return null;
	}
}
