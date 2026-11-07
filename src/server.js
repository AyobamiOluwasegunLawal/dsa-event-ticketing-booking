import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './http/app.js';
import { config } from './config.js';

export function startServer({ port = config.port, publicDir = config.publicDir } = {}) {
  const server = createServer(createApp({ publicDir }));
  server.listen(port, () => {
    console.log(`Event ticketing server listening on port ${port}.`);
  });
  return server;
}

const isMainModule =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMainModule) {
  const server = startServer();
  server.on('error', (error) => {
    console.error(`Unable to start server: ${error.message}`);
    process.exitCode = 1;
  });
}
