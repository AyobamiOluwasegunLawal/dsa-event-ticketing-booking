import { DomainError } from '../domain/errors.js';

function validateMethod(method) {
  if (typeof method !== 'string' || !/^[A-Za-z]+$/.test(method)) {
    throw new DomainError('VALIDATION', 'Route method must be a valid HTTP method.');
  }
  return method.toUpperCase();
}

function splitPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('?') || path.includes('#')) {
    throw new DomainError('VALIDATION', 'Route path must be an absolute path without a query or fragment.');
  }
  if (path === '/') {
    return [];
  }
  return path.replace(/\/+$/, '').slice(1).split('/');
}

function compilePath(path) {
  const segments = splitPath(path);
  const names = [];
  const pattern = segments.map((segment) => {
    if (segment.startsWith(':')) {
      const name = segment.slice(1);
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name) || names.includes(name)) {
        throw new DomainError('VALIDATION', `Invalid route parameter: ${segment}.`);
      }
      names.push(name);
      return '([^/]+)';
    }
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

  return { names, expression: new RegExp(`^/${pattern.join('/')}/?$`) };
}

export class Router {
  #routes = [];

  add(method, path, handler) {
    const normalizedMethod = validateMethod(method);
    if (typeof handler !== 'function') {
      throw new DomainError('VALIDATION', 'Route handler must be a function.');
    }

    const { names, expression } = compilePath(path);
    this.#routes.push({ method: normalizedMethod, names, expression, handler });
    return this;
  }

  get(path, handler) {
    return this.add('GET', path, handler);
  }

  post(path, handler) {
    return this.add('POST', path, handler);
  }

  match(method, path) {
    const normalizedMethod = validateMethod(method);
    if (typeof path !== 'string') {
      throw new DomainError('VALIDATION', 'Request path must be a string.');
    }

    for (const route of this.#routes) {
      if (route.method !== normalizedMethod) {
        continue;
      }
      const match = route.expression.exec(path);
      if (!match) {
        continue;
      }

      const params = {};
      try {
        route.names.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]);
        });
      } catch {
        throw new DomainError('VALIDATION', 'Request path contains invalid encoding.');
      }
      return { handler: route.handler, params };
    }

    return null;
  }

  async dispatch(method, path, context = {}) {
    const match = this.match(method, path);
    if (!match) {
      return null;
    }
    return match.handler({ ...context, params: match.params });
  }
}
