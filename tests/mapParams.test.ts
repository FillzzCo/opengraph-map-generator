import { parseMapParams, buildMapUrl } from '../src/mapParams';
import { expect, test } from 'bun:test';

test('parse valid parameters', () => {
	const url =
		'https://example.com/map?name=Foo&city=Bar&provider=test&lat=1.2&lng=3.4&zoom=10&overlay=pin-s-star%2Bf00(0,0)&bearing=20&pitch=30';
	const params = parseMapParams(url);
	expect(params).toEqual({
		stationName: 'Foo',
		city: 'Bar',
		provider: 'test',
		lat: 1.2,
		lng: 3.4,
		zoom: 10,
		overlay: 'pin-s-star+f00(0,0)',
		bearing: 20,
		pitch: 30,
	});
});

test('missing coordinates return undefined', () => {
	const url = 'https://example.com/map?name=Foo';
	const params = parseMapParams(url);
	expect(params.lat).toBeUndefined();
	expect(params.lng).toBeUndefined();
	expect(params.overlay).toBeUndefined();
	expect(params.provider).toBeUndefined();
});

test('invalid zoom throws', () => {
	expect(() => parseMapParams('https://ex.com/map?zoom=50')).toThrow('Invalid zoom level');
});

test('buildMapUrl', () => {
	const url = buildMapUrl(1, 2, 5, 'token');
	expect(url).toContain('/1200x630@2x');
	expect(url).toContain('access_token=token');
	expect(url).toContain('mapbox/streets-v12');
});
