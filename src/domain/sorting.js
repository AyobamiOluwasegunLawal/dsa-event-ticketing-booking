import { DomainError } from './errors.js';

export function mergeSort(items, compare) {
  if (!Array.isArray(items)) {
    throw new DomainError('VALIDATION', 'items must be an array.');
  }
  if (typeof compare !== 'function') {
    throw new DomainError('VALIDATION', 'compare must be a function.');
  }

  const result = Array.from(items);
  if (result.length < 2) {
    return result;
  }

  let source = result;
  let target = new Array(result.length);

  for (let width = 1; width < result.length; width *= 2) {
    for (let start = 0; start < result.length; start += width * 2) {
      const middle = Math.min(start + width, result.length);
      const end = Math.min(start + width * 2, result.length);
      let left = start;
      let right = middle;
      let output = start;

      while (left < middle && right < end) {
        if (compare(source[left], source[right]) <= 0) {
          target[output] = source[left];
          left += 1;
        } else {
          target[output] = source[right];
          right += 1;
        }
        output += 1;
      }

      while (left < middle) {
        target[output] = source[left];
        left += 1;
        output += 1;
      }
      while (right < end) {
        target[output] = source[right];
        right += 1;
        output += 1;
      }
    }

    [source, target] = [target, source];
  }

  return source;
}
