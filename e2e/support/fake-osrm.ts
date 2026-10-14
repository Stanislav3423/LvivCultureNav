// Заглушка OSRM для E2E: завжди повертає маршрут 1,5 км / 20 хв через проміжну точку
import http from 'node:http';

const port = Number(process.env.OSRM_PORT ?? 5999);

http
  .createServer((req, res) => {
    if (req.url === '/health') {
      res.end('ok');
      return;
    }
    const match = req.url?.match(/\/route\/v1\/foot\/([\d.]+),([\d.]+);([\d.]+),([\d.]+)/);
    if (!match) {
      res.writeHead(400).end();
      return;
    }
    const [lng1, lat1, lng2, lat2] = match.slice(1).map(Number);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        code: 'Ok',
        routes: [
          {
            distance: 1500,
            duration: 1200,
            geometry: {
              type: 'LineString',
              coordinates: [
                [lng1, lat1],
                [lng2, lat1],
                [lng2, lat2],
              ],
            },
          },
        ],
      }),
    );
  })
  .listen(port, '127.0.0.1', () => console.info(`fake OSRM on :${port}`));
