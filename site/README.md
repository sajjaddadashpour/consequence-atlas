# site/

Static site for the [TOE Consequences Atlas](https://toeatlas.si).

The front page is a playground. The registry (the card and link table) is `registry.html`. The builder reads `cards/`, `dead-ends/`, `atlas/links/`, `atlas/stages/`, and `dials/` (examples are excluded) and writes plain HTML, CSS, JS, the model modules, and a compact `data/index.json`. The builder does not evaluate atlas conditions and does not invent claims. The playground does evaluate pass or fail, in the browser, by calling `site/engine/atlas.js`, and it does not change any stored label.

```
python3 -m pip install -r requirements.txt
python3 site/build.py --out dist/site --cname toeatlas.si
node site/check-models.mjs
node site/check-runs.mjs
```

`make site` writes `dist/site`. The generated tree is not committed on `main`. GitHub Pages serves it from the `gh-pages` branch. Keep the `CNAME` file (`toeatlas.si`) when publishing.

How to add or replace a model: `site/MODELS.md`. The physics layer in `site/engine/` is the physicist's and is left unchanged. A shared run is the page address. Saved runs stay in the browser behind `saveRun` / `listRuns` / `getRun` (`site/RUNS.md`). There is no account and no server.

Label wording is taken from `README.md` and `docs/CARD_SCHEMA_v0.md`.

## Publish to GitHub Pages

`site/pages.workflow.yml` is the workflow. It is not installed under `.github/workflows/` (the token that added the site could not write workflow files). To publish the playground:

1. Copy `site/pages.workflow.yml` to `.github/workflows/pages.yml`.
2. Push that file to `main`.

The workflow builds with `python3 site/build.py --out dist/site --cname toeatlas.si` and publishes `dist/site` to the `gh-pages` branch. Merges to `main` still need an owner's approval; the workflow runs only after a commit lands there, or when someone dispatches it by hand.

To publish once, without installing the workflow, build into a folder and push that folder to `gh-pages` (this replaces the branch's tree, so keep `CNAME` and `.nojekyll`, which the builder writes):

```
python3 site/build.py --out dist/site --cname toeatlas.si
git checkout gh-pages
# replace the published tree with dist/site, then commit and push
```
