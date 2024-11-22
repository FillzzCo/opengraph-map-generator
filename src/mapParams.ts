export interface MapParams {
	stationName: string;
	city: string;
	/** Provider slug used to fetch the logo */
	provider?: string;
	lat?: number;
	lng?: number;
	zoom: number;
	overlay?: string;
	bearing: number;
	pitch: number;
}

/**
 * Parse and validate incoming request parameters for map generation.
 * Throws a TypeError on invalid input.
 */
export function parseMapParams(url: string): MapParams {
	const p = new URL(url).searchParams;
	const stationName = p.get('name') || 'Fillzz.com';
	const city = p.get('city') ?? '';
	const provider = p.get('provider') ?? undefined;

	const latStr = p.get('lat');
	const lngStr = p.get('lng');
	const zoomStr = p.get('zoom');

	const lat = latStr !== null ? parseFloat(latStr) : undefined;
	const lng = lngStr !== null ? parseFloat(lngStr) : undefined;
	const zoom = zoomStr !== null ? parseInt(zoomStr, 10) : 15;

	if (zoom !== undefined && (Number.isNaN(zoom) || zoom < 0 || zoom > 20)) {
		throw new TypeError('Invalid zoom level');
	}
	if (latStr !== null && Number.isNaN(lat!)) {
		throw new TypeError('Invalid latitude');
	}
	if (lngStr !== null && Number.isNaN(lng!)) {
		throw new TypeError('Invalid longitude');
	}

	const bearing = p.get('bearing') ? parseInt(p.get('bearing')!, 10) : 0;
	const pitch = p.get('pitch') ? parseInt(p.get('pitch')!, 10) : 0;
	let overlay = p.get('overlay') || undefined;
	if (!overlay && lat !== undefined && lng !== undefined) {
		overlay = `pin-l+E74C3C(${lng},${lat})`;
	}

	if (bearing < 0 || bearing > 360 || Number.isNaN(bearing)) {
		throw new TypeError('Invalid bearing value');
	}
	if (pitch < 0 || pitch > 60 || Number.isNaN(pitch)) {
		throw new TypeError('Invalid pitch value');
	}

	return { stationName, city, provider, lat, lng, zoom, overlay, bearing, pitch };
}

export interface MapUrlOptions {
	overlay?: string;
	bearing?: number;
	pitch?: number;
}

export function buildMapUrl(
	lat: number,
	lng: number,
	zoom: number,
	token: string,
	options: MapUrlOptions = {},
): string {
	const style = 'mapbox/streets-v12';
	const overlay = options.overlay ?? `pin-l+E74C3C(${lng},${lat})`;
	const bearing = options.bearing ?? 0;
	const pitch = options.pitch ?? 0;

	return (
		`https://api.mapbox.com/styles/v1/${style}/static/` +
		`${encodeURIComponent(overlay)}/${lng},${lat},${zoom},${bearing},${pitch}/1200x630@2x` +
		`?attribution=false&logo=false&access_token=${token}`
	);
}
