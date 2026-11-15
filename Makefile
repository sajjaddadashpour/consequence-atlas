# Consequence Atlas data layer.
# validate checks the repository. test runs the fixture suite. bundle writes dist/.

PYTHON ?= python3
ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))

.PHONY: validate test bundle site stages

validate:
	cd "$(ROOT)" && $(PYTHON) -m verify && $(PYTHON) -m verify.gen_stages --check

stages:
	cd "$(ROOT)" && $(PYTHON) -m verify.gen_stages

test:
	cd "$(ROOT)" && $(PYTHON) -m pytest -q verify/tests

bundle:
	cd "$(ROOT)" && mkdir -p dist && $(PYTHON) -m verify.bundle --output dist/atlas-bundle.json

site:
	cd "$(ROOT)" && mkdir -p dist/site && $(PYTHON) site/build.py --out dist/site --cname toeatlas.si
