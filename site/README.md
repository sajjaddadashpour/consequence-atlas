# site/

Static front page for the [TOE Consequences Atlas](https://toeatlas.si).

The builder reads `cards/`, `dead-ends/` and `atlas/links/` (examples are excluded) and writes plain HTML, CSS, JS plus a compact `data/index.json`. It does not invent claims or results.

```
python3 -m pip install -r requirements.txt
python3 site/build.py --out dist/site --cname toeatlas.si
```

`make site` does the same, writing to `dist/site`. The generated tree is not committed on `main`; GitHub Pages serves it from the `gh-pages` branch. Keep the `CNAME` file (`toeatlas.si`) when publishing.

Label wording is taken from `README.md` and `docs/CARD_SCHEMA_v0.md`.

Automatic republishing (optional): GitHub Pages is updated by publishing the
generated tree to the `gh-pages` branch. A workflow that does this on pushes
to `main` is saved at `site/pages.workflow.yml`. Copy it to
`.github/workflows/pages.yml` to enable it. That path could not be added in
this branch because the GitHub token used here lacks the `workflow` scope.
