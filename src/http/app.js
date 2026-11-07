import { realpath, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { DomainError } from '../domain/errors.js';
import { Router } from './router.js';

const JSON_BODY_LIMIT = 1024 * 1024;
const ERROR_STATUS = new Map([
  ['VALIDATION', 400],
  ['INVALID_JSON', 400],
  ['INVALID_TRANSITION', 409],
  ['NOT_FOUND', 404],
]);
const CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

function sendJson(response, status, body, headOnly = false) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'x-content-type-options': 'nosniff',
  });
  response.end(headOnly ? undefined : payload);
}

function sendError(response, status, code, message, headOnly = false) {
  sendJson(response, status, { error: { code, message } }, headOnly);
}

async function readJsonBody(request) {
  if (!request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase().includes('application/json')) {
    return undefined;
  }

  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > JSON_BODY_LIMIT) {
      throw new DomainError('PAYLOAD_TOO_LARGE', 'Request body is too large.');
    }
    chunks.push(chunk);
  }

  if (length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new DomainError('INVALID_JSON', 'Request body must contain valid JSON.');
  }
}

function isWithinDirectory(directory, filePath) {
  const relativePath = path.relative(directory, filePath);
  return relativePath === '' ||
    (relativePath !== '..' && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath));
}

async function serveStatic(request, response, pathname, publicDirectory, headOnly) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    sendError(response, 400, 'VALIDATION', 'Request path contains invalid encoding.', headOnly);
    return;
  }

  if (decodedPath.includes('\0') || decodedPath.includes('\\')) {
    sendError(response, 400, 'VALIDATION', 'Request path is invalid.', headOnly);
    return;
  }

  const root = await realpath(publicDirectory);
  let filePath = path.resolve(root, `.${decodedPath === '/' ? '/index.html' : decodedPath}`);
  if (!isWithinDirectory(root, filePath)) {
    sendError(response, 404, 'NOT_FOUND', 'File not found.', headOnly);
    return;
  }

  try {
    let fileInfo = await stat(filePath);
    if (fileInfo.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      fileInfo = await stat(filePath);
    }
    if (!fileInfo.isFile()) {
      throw Object.assign(new Error('Not a file'), { code: 'ENOENT' });
    }

    const resolvedFile = await realpath(filePath);
    if (!isWithinDirectory(root, resolvedFile)) {
      sendError(response, 404, 'NOT_FOUND', 'File not found.', headOnly);
      return;
    }

    const content = await readFile(resolvedFile);
    response.writeHead(200, {
      'content-type': CONTENT_TYPES.get(path.extname(resolvedFile).toLowerCase()) ?? 'application/octet-stream',
      'content-length': content.length,
      'x-content-type-options': 'nosniff',
    });
    response.end(headOnly ? undefined : content);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      sendError(response, 404, 'NOT_FOUND', 'File not found.', headOnly);
      return;
    }
    throw error;
  }
}

export function createApp({ publicDir = path.resolve('public'), router = new Router() } = {}) {
  router.get('/health', () => ({ status: 200, body: { status: 'ok' } }));

  return async function app(request, response) {
    const headOnly = request.method === 'HEAD';
    try {
      const requestUrl = new URL(request.url, 'http://localhost');
      const body = await readJsonBody(request);
      const result = await router.dispatch(request.method, requestUrl.pathname, {
        request,
        url: requestUrl,
        body,
      });

      if (result !== null) {
        const status = Number.isInteger(result?.status) ? result.status : 200;
        const responseBody = Object.hasOwn(result ?? {}, 'body') ? result.body : result;
        sendJson(response, status, responseBody, headOnly);
        return;
      }

      if (requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/')) {
        sendError(response, 404, 'NOT_FOUND', 'API route not found.', headOnly);
        return;
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        sendError(response, 404, 'NOT_FOUND', 'Route not found.', headOnly);
        return;
      }
      await serveStatic(request, response, requestUrl.pathname, publicDir, headOnly);
    } catch (error) {
      if (response.headersSent) {
        response.destroy();
        return;
      }
      if (error instanceof DomainError) {
        sendError(
          response,
          ERROR_STATUS.get(error.code) ?? 400,
          error.code,
          error.message,
          headOnly,
        );
        return;
      }
      sendError(response, 500, 'INTERNAL_ERROR', 'An internal server error occurred.', headOnly);
    }
  };
}
