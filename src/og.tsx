import { Hono } from 'hono';
import { ImageResponse } from '@cloudflare/pages-plugin-vercel-og/api';
import { getLocalFonts } from './getFonts'; // ou adapte selon ton chemin
import { loadImage } from './loadImage';

const app = new Hono();

export default app.on('GET', '/map/:stationName', async (c) => {
	const stationName = decodeURIComponent(c.req.param('stationName') || 'Station inconnue');
	const latitude = 42.6829302;
	const longitude = 2.9066057;

	const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+000(${longitude},${latitude})/${longitude},${latitude},17,0,1/1200x630@2x?attribution=false&logo=false&access_token=pk.eyJ1IjoidGhvbWFzLXJ4IiwiYSI6ImNsenVpOWt2bTBuczgybXM1ZW44NW0yeG0ifQ.zNJDHwwgx0djlr9Ltz4jUA`;
	console.log('Map URL:', mapUrl);

	const backgroundImage = await loadImage(c, mapUrl);
	const fonts = await getLocalFonts(c, [{ path: 'Inter-Bold.ttf', weight: 700 }]);

	const font = Array.isArray(fonts) ? fonts[0] : fonts;

	return new ImageResponse(
		(
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					position: 'relative',
					fontFamily: font.name,
				}}
			>
				{/* Image de fond */}
				<img
					src={backgroundImage || ''}
					alt="Map Background"
					style={{
						position: 'absolute',
						width: '100%',
						height: '100%',
						objectFit: 'cover',
					}}
				/>

				<div
					style={{
						position: 'absolute',
						bottom: 0,
						width: '100%',
						height: '100%',
						background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 80%, transparent 100%)',
					}}
				/>

				<div
					style={{
						position: 'relative',
						marginTop: 'auto',
						padding: '40px 60px',
						color: 'white',
						textShadow: '0 2px 4px rgba(0,0,0,0.6)',
						fontSize: 64,
						fontWeight: 700,
					}}
				>
					{stationName}
				</div>
			</div>
		),
		{
			width: 1200,
			height: 630,
			fonts: [font],
		},
	);
});
