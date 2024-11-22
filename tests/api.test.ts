import app from '../src/index';
import { test, expect, beforeAll } from 'bun:test';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

// Polyfill Cloudflare Workers cache API and fix wasm fetch paths
(globalThis as any).caches = {
	default: {
		async match() {
			return undefined;
		},
		async put() {},
	},
} as any;
const originalFetch = globalThis.fetch;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
	const url = typeof input === 'string' ? input : input.toString();
	if (url.endsWith('.wasm') && !url.startsWith('http')) {
		return originalFetch('file://' + url, init);
	}
	if (url.startsWith('https://api.mapbox.com')) {
		const fallback = path.join(__dirname, '../public/images/fallback-map.png');
		const data = fs.readFileSync(fallback);
		return Promise.resolve(new Response(data as any, { status: 200, headers: { 'content-type': 'image/png' } }));
	}
	return originalFetch(input as any, init);
}) as any;

class DummyImageResponse {
	constructor() {
		const img = fs.readFileSync(path.join(__dirname, '../public/images/fallback-map.png'));
		return new Response(img as any, { headers: { 'content-type': 'image/png' } });
	}
}
(globalThis as any).__ImageResponse = DummyImageResponse;

function createEnv() {
	const token =
		process.env.MAPBOX_TOKEN ||
		'pk.eyJ1IjoidGhvbWFzLXJ4IiwiYSI6ImNsenVpOWt2bTBuczgybXM1ZW44NW0yeG0ifQ.zNJDHwwgx0djlr9Ltz4jUA';
	return {
		MAPBOX_TOKEN: token,
		ASSETS: {
			async fetch(url: string) {
				const pathname = new URL(url).pathname.replace(/^\//, '');
				const file = path.join(__dirname, '../public', pathname);
				const data = await fsPromises.readFile(file);
				const ext = path.extname(file);
				const type = ext === '.png' ? 'image/png' : ext === '.ico' ? 'image/x-icon' : 'application/octet-stream';
				return new Response(data as any, { status: 200, headers: { 'content-type': type } });
			},
		},
	};
}

beforeAll(async () => {
	await fsPromises.mkdir(path.join(__dirname, 'out'), { recursive: true });
});

test('generate map image', async () => {
	const env = createEnv();
	const req = new Request('http://localhost:8787/v1/map?lat=48.8566&lng=2.3522&zoom=10');
	const res = await app.fetch(req, env);
	expect(res.status).toBe(200);
	expect(res.headers.get('content-type')?.includes('image')).toBe(true);
	const buffer = Buffer.from(await res.arrayBuffer());
	expect(buffer.length).toBeGreaterThan(0);
	await fsPromises.writeFile(path.join(__dirname, 'out', 'paris.png'), buffer as any);
});

test('fallback image when missing coordinates', async () => {
	const env = createEnv();
	const req = new Request('http://localhost:8787/v1/map?name=Test');
	const res = await app.fetch(req, env);
	expect(res.status).toBe(200);
	const buffer = Buffer.from(await res.arrayBuffer());
	expect(buffer.length).toBeGreaterThan(0);
	await fsPromises.writeFile(path.join(__dirname, 'out', 'fallback.png'), buffer as any);
});
