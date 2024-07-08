import * as crypto from 'crypto';

export function md5(str: string) {
  const hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
}

export function uniqBy<T>(array, key): T[] {
  const seen = new Map();
  return array.reduce((acc, item) => {
    const val = item[key];
    if (!seen.has(val)) {
      seen.set(val, true);
      acc.push(item);
    }
    return acc;
  }, []);
}
