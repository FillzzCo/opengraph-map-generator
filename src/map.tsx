import { Hono } from 'hono';
import { getLocalFonts } from './getFonts';
import { loadImage } from './loadImage';
import { parseMapParams, buildMapUrl } from './mapParams';

const FILLZZ_LOGO = '/images/dark-banner.png';
const FALLBACK_MAP = '/images/fallback-map.png';

const app = new Hono<{ Bindings: { MAPBOX_TOKEN: string; ASSETS: Fetcher } }>();

export default app.on('GET', '/map', async (c) => {
	try {
		const { ImageResponse } = (globalThis as any).__ImageResponse
			? { ImageResponse: (globalThis as any).__ImageResponse }
			: await import('@cloudflare/pages-plugin-vercel-og/api');
		const params = parseMapParams(c.req.url);
		console.log('Generating image for:', params);

		const token = c.env.MAPBOX_TOKEN as string | undefined;
		if (!token) {
			throw new Error('MAPBOX_TOKEN not configured');
		}

		let bgImg: string | null;
		if (params.lat !== undefined && params.lng !== undefined) {
			const mapUrl = buildMapUrl(params.lat, params.lng, params.zoom, token, {
				overlay: params.overlay,
				bearing: params.bearing,
				pitch: params.pitch,
			});
			console.log('Map URL:', mapUrl);
			bgImg = await loadImage(c, mapUrl);
		} else {
			bgImg = await loadImage(c, FALLBACK_MAP);
			return new ImageResponse(
				(
					<div
						style={{
							width: '100%',
							height: '100%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: '#000',
						}}
					>
						<img
							src={bgImg!}
							style={{ width: '100%', height: '100%', objectFit: 'cover' }}
						/>
					</div>
				),
				{
					width: 1200,
					height: 630,
					fonts: [], // No custom fonts needed for fallback
				},
			);
		}

		const fillzzLogo = await loadImage(c, FILLZZ_LOGO);
		const providerLogoUrl = params.provider
			? `https://example.com/provider/${params.provider.replace('_', '-')}/logo.png`
			: undefined;
		const providerLogo = providerLogoUrl ? await loadImage(c, providerLogoUrl) : null;

		const [montserratBold, montserratMedium] = await getLocalFonts(c, [
			{ path: 'Montserrat-Bold.ttf', weight: 700 },
			{ path: 'Montserrat-Medium.ttf', weight: 500 },
		]);

		return new ImageResponse(
			(
				<div
					style={{
						width: '100%',
						height: '100%',
						position: 'relative',
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					{bgImg && (
						<img
							src={bgImg}
							style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
						/>
					)}

					<div
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							inset: 0,
							height: '40%',
							width: '40%',
							opacity: 0.8,
							background:
								'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 70%)',
						}}
					/>

					{fillzzLogo && (
						<img
							src={fillzzLogo}
							style={{ position: 'absolute', inset: 0, margin: 'auto', top: 40, left: 40, width: 160 }}
						/>
					)}

					<div
						style={{
							position: 'absolute',
							bottom: -30,
							left: 0,
							right: 0,
							inset: 0,
							height: '65%',
							width: '100%',
							background:
								'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.1) 60%, transparent 90%)',
						}}
					/>

					<div
						style={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							marginTop: 'auto',
							padding: '0 40px 40px',
							display: 'flex',
							alignItems: 'center',
							gap: 32,
						}}
					>
						{providerLogo && (
							<img
								src={providerLogo}
								style={{
									position: 'relative',
									width: 120,
									height: 120,
									background: 'transparent',
									borderRadius: 60,
								}}
							/>
						)}
						<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
							<span
								style={{
									fontFamily: montserratBold.name,
									fontSize: 54,
									lineHeight: 1.1,
									fontWeight: 700,
									maxWidth: '980px',
									wordBreak: 'break-word',
									color: 'white',
								}}
							>
								{params.stationName}
							</span>
							{params.city && (
								<span
									style={{
										fontFamily: montserratMedium.name,
										marginTop: 12,
										marginLeft: 4,
										fontSize: 38,
										lineHeight: 1.1,
										color: 'white',
									}}
								>
									{params.city}
								</span>
							)}
						</div>
					</div>
				</div>
			),
			{
				width: 1200,
				height: 630,
				fonts: [montserratBold, montserratMedium],
			},
		);
	} catch (err) {
		console.error('Failed to generate OG image:', err);
		const status = err instanceof TypeError ? 400 : 500;
		return c.json({ error: err instanceof Error ? err.message : String(err) }, status);
	}
});
