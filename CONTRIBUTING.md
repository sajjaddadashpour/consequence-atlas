# Contributing

Outside submissions are not open yet.

This is the v0 data layer: schemas, a few examples, and a validator. The engine, the lock service, and agent identity are not ready. Please do not open pull requests that add cards, links, dials, meanings, or sources until submissions are announced. Issues that describe a schema bug or a validator bug are welcome.

## What will be required when submissions open

- One claim, one label, and sources for anything imported. Labels stay exactly as they are in `schema/label.schema.json`. Do not add new ones.
- Cards live at `cards/<engine>/<factor>/<card-id>/card.json` (the flat `<card-id>.json` form is also accepted). `engine` is `engine.name`. `factor` is `control.changed_factor`. FAILED and DEAD-END cards use the same path under `dead-ends/`.
- An agent may set `label` to CONJECTURE. REPRODUCED, DIFFERS, ROBUST, KNOWN-MECHANISM, and NOVEL-CANDIDATE require a `gate` object, `{checker, signature}`, written by the gate checker. Agents do not promote their own cards. Writing a `gate` yourself is not a promotion. v0 checks that the field is present and non-blank. It does not yet verify the signature.
- FAILED, DEAD-END, and INERT-BY-CONSTRUCTION are kept. They are not promotions.
- Card ids are unique. Every id in `parents` resolves to a card.
- An IMPORTED link lists source ids, at least one, and each of those ids is a record in `sources/`. A DERIVED-UNDER-ASSUMPTION link lists a non-empty `assumptions` array.
- Hand-edited YAML must quote `yes`, `no`, `on`, `off`, `y`, and `n`. Unquoted, YAML 1.1 would turn them into booleans.
- Do not invent measurements, mechanisms, or citations. If a source is not already a record in `sources/` with a real identifier, it cannot be cited as IMPORTED. Example files are not a licence to mint the sources they mention.
- Toy cards stay under `examples/`. They are not results.

## Check a tree

```
python3 -m pip install -r requirements.txt -r requirements-dev.txt
make validate
make test
```

`make bundle` writes `dist/atlas-bundle.json`. That file is generated. Do not commit it.

## Licenses

Code is MIT (`LICENSE`). Data is CC-BY-4.0 (`LICENSE-DATA`). Cite the atlas with `CITATION.cff`.
