/**
 * Secure Personal Access Token storage for the AlternateFutures CLI.
 *
 * Layered design (each layer independently optional):
 *
 *   1. In-memory cache         — keeps `get()` synchronous so existing
 *                                callers don't need to be made async.
 *   2. OS keychain (`keytar`)  — primary on-disk store. Native module,
 *                                listed as optionalDependency so install
 *                                still succeeds on minimal Linux images
 *                                where libsecret isn't available.
 *   3. File fallback           — `~/.alternate-futures/token` written
 *                                with mode `0600` inside a directory
 *                                created with mode `0700`. Used when
 *                                keytar is unavailable or fails at
 *                                runtime (CI containers, headless
 *                                hosts, etc.).
 *
 * The previous storage location was a plaintext JSON file managed by
 * the `conf` package — `~/.config/alternate-futures/global.json` on
 * Linux, `~/Library/Application Support/...` on macOS, etc. The
 * `migrateLegacyToken` helper picks that up on first init and moves it
 * into whichever secure store is active, then deletes the legacy file
 * key.
 */

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SERVICE = 'alternate-futures';
const ACCOUNT = 'personalAccessToken';

const FALLBACK_DIR = path.join(os.homedir(), '.alternate-futures');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'token');

type KeytarModule = {
  getPassword: (service: string, account: string) => Promise<string | null>;
  setPassword: (
    service: string,
    account: string,
    password: string,
  ) => Promise<void>;
  deletePassword: (service: string, account: string) => Promise<boolean>;
};

let cachedToken: string | undefined;
let initialized = false;

// `undefined` = not yet attempted, `null` = attempted and unavailable,
// `KeytarModule` = loaded.
let keytarModule: KeytarModule | null | undefined;

async function loadKeytar(): Promise<KeytarModule | null> {
  if (keytarModule !== undefined) return keytarModule;
  try {
    // Dynamic import behind a string variable so the TypeScript
    // compiler doesn't attempt to resolve `keytar` types at build
    // time (it's an optionalDependency — installs may legitimately
    // skip it on Alpine / CI / unsupported platforms).
    const moduleName = 'keytar';
    const mod = (await import(moduleName)) as unknown as KeytarModule;
    if (typeof mod.getPassword !== 'function') {
      keytarModule = null;
      return null;
    }
    // Smoke-test that the native bindings actually load on this host.
    // keytar throws `Cannot find module ...node` or libsecret errors
    // on the first real call; we'd rather know at init time.
    await mod.getPassword(SERVICE, ACCOUNT).catch(() => null);
    keytarModule = mod;
    return mod;
  } catch {
    keytarModule = null;
    return null;
  }
}

async function readFromFile(): Promise<string | undefined> {
  try {
    const buf = await fs.readFile(FALLBACK_FILE, 'utf8');
    const trimmed = buf.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

async function writeToFile(value: string): Promise<void> {
  await fs.mkdir(FALLBACK_DIR, { recursive: true, mode: 0o700 });
  await fs.writeFile(FALLBACK_FILE, value, { mode: 0o600 });
  // Belt-and-suspenders: writeFile only honours the mode argument when
  // the file is created. If it already exists it keeps its previous
  // mode, so re-apply 0600 explicitly. Best-effort — Windows will
  // throw, which is fine because Windows ACLs already restrict the
  // user-profile directory.
  try {
    await fs.chmod(FALLBACK_FILE, 0o600);
  } catch {
    // ignore (Windows / non-POSIX FS)
  }
}

async function deleteFile(): Promise<void> {
  try {
    await fs.unlink(FALLBACK_FILE);
  } catch {
    // ignore (file already gone)
  }
}

/**
 * Hydrate the in-memory cache from whichever secure store has the token.
 * Idempotent — safe to call multiple times.
 *
 * Must be invoked before `getSecureToken()` returns a useful value.
 */
export async function initSecureToken(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const keytar = await loadKeytar();
  if (keytar) {
    try {
      const v = await keytar.getPassword(SERVICE, ACCOUNT);
      if (v) {
        cachedToken = v;
        return;
      }
    } catch {
      // fall through to file fallback
    }
  }

  const fileVal = await readFromFile();
  if (fileVal) cachedToken = fileVal;
}

/**
 * Synchronous read from the in-memory cache. Returns `undefined` until
 * `initSecureToken()` has resolved.
 */
export function getSecureToken(): string | undefined {
  return cachedToken;
}

/**
 * Whether keytar successfully loaded for this process. Useful for
 * diagnostic output ("PAT stored in OS keychain" vs "PAT stored in
 * `~/.alternate-futures/token`").
 */
export async function isKeychainAvailable(): Promise<boolean> {
  const k = await loadKeytar();
  return k !== null;
}

/**
 * Persist the PAT. Writes to keychain when available, otherwise to the
 * 0600 file fallback. Always updates the in-memory cache so subsequent
 * sync `get`s return the new value immediately.
 */
export async function setSecureToken(value: string): Promise<void> {
  cachedToken = value;
  initialized = true;

  const keytar = await loadKeytar();
  if (keytar) {
    try {
      await keytar.setPassword(SERVICE, ACCOUNT, value);
      // Wipe any plaintext file from a previous run so we don't leave
      // a divergent / stale copy on disk.
      await deleteFile();
      return;
    } catch {
      // fall through to file fallback
    }
  }

  await writeToFile(value);
}

/**
 * Remove the PAT from every store the cache has seen. Best-effort on
 * each backend so a partial logout doesn't leave a token behind.
 */
export async function clearSecureToken(): Promise<void> {
  cachedToken = undefined;

  const keytar = await loadKeytar();
  if (keytar) {
    try {
      await keytar.deletePassword(SERVICE, ACCOUNT);
    } catch {
      // ignore
    }
  }

  await deleteFile();
}

/**
 * One-time migration from the legacy `conf`-managed plaintext JSON
 * file. The caller passes the legacy value (read once at startup) and
 * a callback to delete it from the legacy store on success — keeps
 * this module independent of the `conf` API surface.
 */
export async function migrateLegacyToken(
  legacyValue: string | undefined,
  deleteFromLegacy: () => void,
): Promise<void> {
  if (!legacyValue) return;
  if (cachedToken) return; // already migrated on a previous run
  await setSecureToken(legacyValue);
  try {
    deleteFromLegacy();
  } catch {
    // non-fatal — worst case the legacy file lingers until next logout
  }
}
