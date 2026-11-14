# Runs

A playground run is one model, one engine version, every parameter, and the seed. v1 keeps that on the static site. There is no account and no server.

## The address is the run

The hash names the model and every control:

```
#particles?v=1&engine=example%400&free=0&dim=2&size=64&steps=400&seed=1&start=scattered&attract=short&temp=0.4&expand=0&light=0&c=1
```

`v` is the run-record format. `engine` is `name@version` from the module's `engine` export. `free=1` is free play. The other keys are the model's `params`, in the module's order, including `seed` when the model has one. Open the link and the page sets those controls. A value outside a locked range turns free play on, so the link still reproduces.

Placeholders export `engine` as `{ name: "example", version: "0" }`. A parity-checked port sets the real engine, for example `{ name: "starter", version: "3.0.0" }`, and only then may `run` return `example: false`. A link whose engine token does not match the module on the page is labelled as a different run. The picture is whatever this page can draw.

## Save run

**Save run** writes a canonical JSON record and adds it to **My runs** in this browser. The same run saved twice is one entry. The hash is SHA-256 of the canonical JSON of the body below, with keys sorted at every object, and without `hash` or `savedAt`.

```json
{
  "format": "consequence-atlas-run",
  "formatVersion": "1",
  "model": "particles",
  "engine": { "name": "example", "version": "0" },
  "seed": 1,
  "params": { "dim": 2, "size": 64, "steps": 400, "seed": 1 },
  "freePlay": false,
  "fidelity": "example",
  "verdict": null,
  "hash": "…"
}
```

`verdict` is null while `fidelity` is `"example"`. An engine port may set `verdict` only together with `fidelity: "engine"` and `example: false`. `savedAt` is storage metadata. It is not part of the hash.

The list is capped at 100 records in the key `toeatlas.runs.v1`.

## Storage adapter

The page never reads `localStorage` itself. It holds an object with three methods:

```js
saveRun(run) -> Promise<run>   // store by run.hash, refresh savedAt
listRuns()   -> Promise<run[]> // newest savedAt first
getRun(id)   -> Promise<run|null>
```

`site/static/storage.js` exports `createLocalStorageAdapter(storage, key)`. Tests use an in-memory storage with the same two methods (`getItem`, `setItem`). The UI imports the adapter and calls only `saveRun`, `listRuns`, and `getRun`.

A later host at `https://api.toeatlas.si` would be a second adapter with those same three methods, constructed beside the local one. The buttons stay as they are. This repository does not call that host.

```js
function createRemoteAdapter({ baseUrl, fetch }) {
  return {
    async saveRun(run) { /* POST ${baseUrl}/runs */ },
    async listRuns() { /* GET ${baseUrl}/runs */ },
    async getRun(id) { /* GET ${baseUrl}/runs/${id} */ },
  };
}
```

## How a saved run would enter the atlas

This is a sketch for later. Nothing here submits a run.

A community run can become a card only as **CONJECTURE**, and only after a person sends an engine run to the gate checker queue.

- The candidate is a saved record whose `fidelity` is `"engine"` and whose `verdict` came from that engine. An `example` record is a picture, not a candidate. The queue refuses it.
- The submission does not write `cards/` and does not set a label above CONJECTURE. There is no `gate` object on it.
- The gate checker reruns that `engine`, those `params`, and that `seed`. The checker, not the submitter, decides whether the output matches and whether the label moves. Agents cannot promote their own cards.
- A match is not a promotion by itself. REPRODUCED and anything above it still need the checker's signature, as in `docs/CARD_SCHEMA_v0.md`.
- Free-play runs stay exploration. They are not locked settings and they are not candidates for the locked card they started from.
- Nothing in the queue is auto-promoted. FAILED, DEAD-END, and INERT-BY-CONSTRUCTION remain labels the checker can keep. They are not promotions either.

Until that queue exists, Save run only fills My runs on this browser.

## Free play

Free play widens a control only when the param has a `free: { min, max }` wider than `min` / `max`. Enums stay on their listed values. Arrow of time stays 0, 1, or 2, because those are the recorded meanings. Free play is always marked **Exploration**, including when every value happens to sit on the lock. Reset to lock leaves free play and restores the locked values.
