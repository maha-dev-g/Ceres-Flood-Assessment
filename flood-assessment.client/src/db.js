const DB_NAME = "flood-db";
const DB_VERSION = 1;
const STORE_NAME = "assessments";
const OPEN_TIMEOUT_MS = 5000;

const LS_KEY = "flood:assessments";

function withTimeout(promise, ms, errorMessage) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function canUseIndexedDb() {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

async function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = safeJsonParse(raw ?? "[]", []);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function writeLocal(items) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // If localStorage is unavailable/full, there's nothing else to do here.
  }
}

async function idbOpen() {
  const openPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    req.onblocked = () => {
      reject(
        new Error(
          "IndexedDB open is blocked (another tab/app is using an older DB version)."
        )
      );
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed."));
  });

  return await withTimeout(openPromise, OPEN_TIMEOUT_MS, "IndexedDB open timed out.");
}

function requestToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed."));
  });
}

async function runIdbTx(mode, fn) {
  const db = await idbOpen();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);

    Promise.resolve()
      .then(() => fn(store))
      .then(
        (result) => {
          tx.oncomplete = () => {
            db.close();
            resolve(result);
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error ?? new Error("IndexedDB transaction failed."));
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error ?? new Error("IndexedDB transaction aborted."));
          };
        },
        (err) => {
          db.close();
          reject(err);
        }
      );
  });
}

export async function saveOffline(data) {
  if (!canUseIndexedDb()) {
    const items = await readLocal();
    const next = items.filter((x) => x?.id !== data?.id);
    next.push(data);
    await writeLocal(next);
    return;
  }

  try {
    await runIdbTx("readwrite", (store) => requestToPromise(store.put(data)));
  } catch {
    // Fallback to localStorage if IndexedDB is unavailable/blocked.
    const items = await readLocal();
    const next = items.filter((x) => x?.id !== data?.id);
    next.push(data);
    await writeLocal(next);
  }
}

export async function getOfflineData() {
  if (!canUseIndexedDb()) return await readLocal();

  try {
    return await runIdbTx("readonly", (store) => requestToPromise(store.getAll()));
  } catch {
    return await readLocal();
  }
}

export async function deleteOffline(id) {
  if (!canUseIndexedDb()) {
    const items = await readLocal();
    await writeLocal(items.filter((x) => x?.id !== id));
    return;
  }

  try {
    await runIdbTx("readwrite", (store) => requestToPromise(store.delete(id)));
  } catch {
    const items = await readLocal();
    await writeLocal(items.filter((x) => x?.id !== id));
  }
}