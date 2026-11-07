import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DomainError } from './domain/errors.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configuredPort = process.env.PORT ?? '3000';
const PORT = Number(configuredPort);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new DomainError('VALIDATION', 'PORT must be a whole number between 1 and 65535.');
}

export const config = Object.freeze({
  port: PORT,
  publicDir: path.join(projectRoot, 'public'),
});
