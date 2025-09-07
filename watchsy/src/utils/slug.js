// Deterministic salted slug from a user UID
// Uses multiple SHA-256 rounds for stronger irreversibility

const SALT = 'watchsy:v1:seo-slug';
const ROUNDS = 1024; // good number of rounds without being too heavy in-browser

function toUint8(str) {
  return new TextEncoder().encode(str);
}

function toBase64Url(bytes) {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return b64;
}

async function deriveWithRounds(input, rounds) {
  const subtle = (window.crypto || window.msCrypto).subtle;
  let data = toUint8(input);
  let digest = await subtle.digest('SHA-256', data);
  for (let i = 1; i < rounds; i++) {
    const next = new Uint8Array(digest);
    const withSalt = new Uint8Array(next.length + 1);
    withSalt.set(next, 0);
    withSalt[next.length] = i & 0xff; // cheap varying salt per round
    digest = await subtle.digest('SHA-256', withSalt);
  }
  return toBase64Url(digest).slice(0, 24);
}

export async function deriveSlug(uid) {
  try {
    return await deriveWithRounds(`${SALT}:${uid}`, ROUNDS);
  } catch (e) {
    // Fallback: simple hash if subtle crypto unavailable
    let h = 2166136261;
    const str = `${SALT}:${uid}`;
    for (let r = 0; r < ROUNDS; r++) {
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
      }
      h >>>= 0;
    }
    return `f${h.toString(16)}`;
  }
}

const LIST_ROUNDS = {
  watchlist: 1400,
  liked: 1800,
  watched: 2200,
};

export async function deriveListSlug(uid, listType) {
  const lt = String(listType || '').toLowerCase();
  const rounds = LIST_ROUNDS[lt] || 1600;
  try {
    return await deriveWithRounds(`${SALT}:${lt}:${uid}`, rounds);
  } catch (e) {
    // Fallback: mix listType into hash
    let h = 2166136261;
    const str = `${SALT}:${lt}:${uid}`;
    for (let r = 0; r < rounds; r++) {
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
      }
      h >>>= 0;
    }
    return `f${h.toString(16)}`;
  }
} 