import { Hono } from 'hono';
import { logger } from 'hono/logger';
import map from './map';

type EnvBindings = {
	MAPBOX_TOKEN: string;
	ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: EnvBindings }>();
app.use('*', logger());

// serve landing page and favicon
app.get('/', async (c) => {
	const res = await c.env.ASSETS.fetch('https://static/index.html');
	return new Response(res.body, res);
});
app.get('/favicon.ico', async (c) => {
	const res = await c.env.ASSETS.fetch('https://static/favicon.ico');
	return new Response(res.body, res);
});

// versioned API
app.route('/v1', map);

export default app;
