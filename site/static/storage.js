/* Storage adapter for saved runs.
   The page calls saveRun, listRuns, and getRun only.
   createLocalStorageAdapter is the v1 implementation.
   A later api.toeatlas.si adapter must export the same three methods.
   See site/RUNS.md. This file does not call a server. */

const DEFAULT_KEY = "toeatlas.runs.v1";
const MAX_RUNS = 100;

function readList(storage, key) {
  let raw = null;
  try {
    raw = storage.getItem(key);
  } catch (err) {
    return [];
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(function (item) { return item && item.hash; }) : [];
  } catch (err) {
    return [];
  }
}

function writeList(storage, key, list) {
  storage.setItem(key, JSON.stringify(list));
}

function createLocalStorageAdapter(storage, key) {
  const storeKey = key || DEFAULT_KEY;
  return {
    async saveRun(run) {
      if (!run || typeof run.hash !== "string" || !run.hash) {
        throw new Error("A saved run needs a hash.");
      }
      const list = readList(storage, storeKey).filter(function (item) { return item.hash !== run.hash; });
      const stored = Object.assign({}, run, { savedAt: new Date().toISOString() });
      list.unshift(stored);
      writeList(storage, storeKey, list.slice(0, MAX_RUNS));
      return stored;
    },
    async listRuns() {
      return readList(storage, storeKey).slice().sort(function (a, b) {
        return String(b.savedAt || "").localeCompare(String(a.savedAt || ""));
      });
    },
    async getRun(id) {
      return readList(storage, storeKey).find(function (item) { return item.hash === id; }) || null;
    },
  };
}

function createMemoryStorage() {
  const bag = new Map();
  return {
    getItem(key) { return bag.has(key) ? bag.get(key) : null; },
    setItem(key, value) { bag.set(key, String(value)); },
  };
}

export { DEFAULT_KEY, MAX_RUNS, createLocalStorageAdapter, createMemoryStorage };
