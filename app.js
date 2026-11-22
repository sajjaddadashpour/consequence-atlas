/* TOE Consequences Atlas browse UI. No framework. */
(function () {
  "use strict";

  const LABEL_ORDER = [
    "ESTABLISHED", "MAINSTREAM-HYPOTHESIS", "CONJECTURE", "ANALOGY-ONLY",
    "REPRODUCED", "DIFFERS", "ROBUST",
    "KNOWN-MECHANISM", "NOVEL-CANDIDATE", "FAILED", "DEAD-END",
    "INERT-BY-CONSTRUCTION", "DERIVED", "DERIVED-UNDER-ASSUMPTION",
    "IMPORTED", "ASSUMED", "CONTESTED"
  ];

  const state = {
    index: null,
    items: [],
    selected: null,
  };

  const $ = (id) => document.getElementById(id);

  function pillClass(label) {
    return "pill pill-" + String(label || "").toLowerCase();
  }

  function fmtNum(value) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "number") {
      if (!Number.isFinite(value)) return String(value);
      const abs = Math.abs(value);
      if (abs !== 0 && (abs < 1e-3 || abs >= 1e4)) return value.toExponential(3);
      return Number.isInteger(value) ? String(value) : String(Math.round(value * 1e6) / 1e6);
    }
    return String(value);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shortId(id) {
    return String(id || "");
  }

  function topicOf(item) {
    if (item.type === "link" || item.type === "crosslink") return item.topic || (item.from + " → " + item.to);
    return item.factor || item.family || "";
  }

  function titleOf(item) {
    if (item.type === "link") return (item.from_name || item.from) + " → " + (item.to_name || item.to);
    if (item.type === "crosslink") return item.topic || item.id;
    return item.id;
  }

  function recordView(item) {
    if (item.type === "link") return "link";
    if (item.type === "crosslink") return "crosslink";
    return "card";
  }

  function parseHash() {
    const raw = (location.hash || "#top").replace(/^#/, "");
    const [path, query] = raw.split("?");
    const params = new URLSearchParams(query || "");
    if (path.startsWith("card/")) return { view: "card", id: decodeURIComponent(path.slice(5)), params };
    if (path.startsWith("link/")) return { view: "link", id: decodeURIComponent(path.slice(5)), params };
    if (path.startsWith("crosslink/")) return { view: "crosslink", id: decodeURIComponent(path.slice(10)), params };
    if (path === "browse" || path === "labels" || path === "contribute" || path === "top" || path === "") {
      return { view: path || "top", id: null, params };
    }
    return { view: "browse", id: null, params };
  }

  function writeHash(view, id, params, replace) {
    let path = view;
    if (view === "card" || view === "link" || view === "crosslink") path = view + "/" + encodeURIComponent(id);
    const q = params && String(params);
    const hash = "#" + path + (q ? "?" + q : "");
    if (replace) history.replaceState(null, "", hash);
    else if (location.hash !== hash) location.hash = hash;
  }

  function filterParams() {
    const params = new URLSearchParams();
    const q = $("q").value.trim();
    const kind = $("kind").value;
    const label = $("label").value;
    const topic = $("topic").value;
    const stage = $("stage").value;
    const engine = $("engine").value;
    const sort = $("sort").value;
    if (q) params.set("q", q);
    if (kind) params.set("kind", kind);
    if (label) params.set("label", label);
    if (topic) params.set("topic", topic);
    if (stage) params.set("stage", stage);
    if (engine) params.set("engine", engine);
    if (sort && sort !== "id") params.set("sort", sort);
    return params;
  }

  function applyParams(params) {
    $("q").value = params.get("q") || "";
    $("kind").value = params.get("kind") || "";
    $("label").value = params.get("label") || "";
    if (params.get("topic")) $("topic").value = params.get("topic");
    if ($("stage")) $("stage").value = params.get("stage") || "";
    if ($("engine")) $("engine").value = params.get("engine") || "";
    $("sort").value = params.get("sort") || "id";
    syncLabelChips();
  }

  function matches(item, q, kind, label, topic, stage, engine) {
    if (kind && item.kind !== kind) return false;
    if (label && item.label !== label) return false;
    if (topic && topicOf(item) !== topic) return false;
    if (stage) {
      if (item.type !== "link") return false;
      if (item.from !== stage && item.to !== stage) return false;
    }
    if (engine) {
      if (item.type === "link" || item.type === "crosslink") return false;
      if (item.engine !== engine) return false;
    }
    if (!q) return true;
    const hay = [
      item.id, item.label, item.kind, item.path, item.notes,
      item.author, item.engine, item.family, item.factor, item.measure,
      item.from, item.to, item.from_name, item.to_name, item.condition,
      item.a_field, item.b_field, item.a_pattern, item.b_pattern, item.connection,
      item.support, item.claim, item.breaks_if, item.proposed_by,
      item.status, item.dead_end_reason, (item.sources || []).join(" "),
      (item.assumptions || []).join(" "), (item.parents || []).join(" "),
      (item.model_refs || []).join(" "),
    ].join(" ").toLowerCase();
    return hay.includes(q);
  }

  function sortItems(items, sort) {
    const copy = items.slice();
    copy.sort(function (a, b) {
      if (sort === "label") {
        const da = LABEL_ORDER.indexOf(a.label);
        const db = LABEL_ORDER.indexOf(b.label);
        if (da !== db) return (da < 0 ? 99 : da) - (db < 0 ? 99 : db);
      } else if (sort === "topic") {
        const cmp = topicOf(a).localeCompare(topicOf(b));
        if (cmp) return cmp;
      } else if (sort === "z") {
        const za = Math.abs((a.result && a.result.z) || 0);
        const zb = Math.abs((b.result && b.result.z) || 0);
        if (za !== zb) return zb - za;
      }
      return String(a.id).localeCompare(String(b.id));
    });
    return copy;
  }

  function renderList() {
    if (!state.index) return;
    const q = $("q").value.trim().toLowerCase();
    const kind = $("kind").value;
    const label = $("label").value;
    const topic = $("topic").value;
    const stage = $("stage") ? $("stage").value : "";
    const engine = $("engine") ? $("engine").value : "";
    const sort = $("sort").value;
    const filtered = sortItems(
      state.items.filter(function (item) { return matches(item, q, kind, label, topic, stage, engine); }),
      sort
    );
    const status = $("status");
    status.textContent = filtered.length + " of " + state.items.length + " records";
    const frag = document.createDocumentFragment();
    filtered.forEach(function (item) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "row";
      btn.dataset.type = item.type;
      btn.dataset.id = item.id;
      if (state.selected && state.selected.id === item.id && state.selected.type === item.type) {
        btn.setAttribute("aria-current", "true");
      }
      btn.innerHTML =
        '<span class="' + pillClass(item.label) + '">' + escapeHtml(item.label) + "</span>" +
        '<span><span class="id">' + escapeHtml(shortId(item.id)) + "</span>" +
        '<span class="topic"> · ' + escapeHtml(topicOf(item) || titleOf(item)) + "</span></span>" +
        '<span class="kind">' + escapeHtml(item.kind) + (item.legacy ? " · legacy" : "") + "</span>";
      btn.addEventListener("click", function () {
        writeHash(recordView(item), item.id, filterParams());
      });
      li.appendChild(btn);
      frag.appendChild(li);
    });
    const results = $("results");
    results.innerHTML = "";
    results.appendChild(frag);
    if (!filtered.length) {
      results.innerHTML = '<li class="row" style="cursor:default">No records match these filters.</li>';
    }
  }

  function row(label, valueHtml) {
    if (valueHtml === null || valueHtml === undefined || valueHtml === "") return "";
    return "<tr><th>" + escapeHtml(label) + "</th><td>" + valueHtml + "</td></tr>";
  }

  function textRow(label, value) {
    if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) return "";
    if (Array.isArray(value)) return row(label, escapeHtml(value.join(", ")));
    if (typeof value === "object") return row(label, "<code>" + escapeHtml(JSON.stringify(value)) + "</code>");
    return row(label, escapeHtml(String(value)));
  }

  function linkToItem(type, id) {
    const prefix = type === "link" ? "link/" : type === "crosslink" ? "crosslink/" : "card/";
    const href = "#" + prefix + encodeURIComponent(id);
    return '<a href="' + href + '"><code>' + escapeHtml(id) + "</code></a>";
  }

  function prototypeMentions(notes) {
    if (!notes) return [];
    var found = [];
    var re = /F1 local verdict:?\s*([A-Z][A-Z-]*)/g;
    var match;
    while ((match = re.exec(notes))) {
      if (found.indexOf(match[1]) < 0) found.push(match[1]);
    }
    return found;
  }

  function prototypeCallout(item) {
    var mentions = prototypeMentions(item.notes);
    if (!mentions.length) return "";
    return '<p class="prototype-check">unsigned prototype check, not a label. The notes mention ' +
      escapeHtml(mentions.join(", ")) +
      ". The label on this card is " + escapeHtml(item.label) + ", the value stored in the card file.</p>";
  }

  function renderCard(item) {
    const result = item.result || {};
    const lock = item.lock || {};
    const novelty = item.novelty || {};
    const parents = (item.parents || []).map(function (id) { return linkToItem("card", id); }).join(", ");
    const github = '<a href="' + escapeHtml(item.github) + '" rel="noopener">Open ' + escapeHtml(item.path) + " on GitHub</a>";
    const legacy = item.legacy
      ? '<span class="badge-legacy">legacy, unverified</span>'
      : "";
    return (
      "<h3>" + escapeHtml(item.id) + legacy + "</h3>" +
      '<p class="lead"><span class="' + pillClass(item.label) + '">' + escapeHtml(item.label) + "</span> · " +
      escapeHtml(item.kind) + (item.family ? " · " + escapeHtml(item.family) : "") + "</p>" +
      '<p class="quiet">Label stored in the card file.</p>' +
      prototypeCallout(item) +
      '<table class="kv"><tbody>' +
      row("Source path", "<code>" + escapeHtml(item.path) + "</code><br>" + github) +
      textRow("Author", item.author) +
      textRow("Engine", item.engine + (item.engine_version ? " " + item.engine_version : "")) +
      textRow("Changed factor", item.factor) +
      textRow("Measure", item.measure + (item.direction ? " · " + item.direction : "")) +
      textRow("Sizes", item.sizes) +
      textRow("Steps", item.steps) +
      textRow("Seeds", item.n_seeds) +
      textRow("Extra measures", item.extra_measures) +
      textRow("Start", item.start) +
      textRow("Settings", item.settings) +
      textRow("Null settings", item.null_settings) +
      row("Lock hash", lock.hash ? "<code>" + escapeHtml(lock.hash) + "</code>" : "—") +
      textRow("Lock time", lock.server_timestamp) +
      textRow("Gate", item.gate ? JSON.stringify(item.gate) : "none") +
      textRow("Label set by", item.label_set_by || "—") +
      textRow("Effect", fmtNum(result.effect)) +
      textRow("SE", fmtNum(result.se)) +
      textRow("z", fmtNum(result.z)) +
      textRow("Half-size z", fmtNum(result.half_size_z)) +
      textRow("Double-size z", fmtNum(result.double_size_z)) +
      textRow("FDR q", fmtNum(result.fdr_q)) +
      textRow("Deterministic", result.deterministic === true ? "yes" : result.deterministic === false ? "no" : "") +
      textRow("Runs in card", item.n_runs) +
      row("Parents", parents || "—") +
      textRow("Meanings", item.meanings) +
      textRow("Nearest cards", novelty.nearest_cards) +
      textRow("Known mechanism", novelty.known_mechanism) +
      textRow("Dead-end reason", item.dead_end_reason) +
      textRow("Schema", item.schema_version) +
      "</tbody></table>" +
      (item.replications && item.replications.length
        ? "<h4>Replications</h4><p>" + escapeHtml(item.replications.map(function (r) {
            return (r.agent || "") + (r.lineage ? " (" + r.lineage + ")" : "") + (r.match === true ? " · match" : r.match === false ? " · no match" : "");
          }).join("; ")) + "</p>"
        : "") +
      (item.notes ? '<h4>Notes</h4><p class="notes">' + escapeHtml(item.notes) + "</p>" : "")
    );
  }

  function renderLink(item) {
    const github = '<a href="' + escapeHtml(item.github) + '" rel="noopener">Open ' + escapeHtml(item.path) + " on GitHub</a>";
    const assumptions = (item.assumptions || []).map(function (line) {
      return "<li>" + escapeHtml(line) + "</li>";
    }).join("");
    return (
      "<h3>" + escapeHtml(item.id) + "</h3>" +
      '<p class="lead"><span class="' + pillClass(item.label) + '">' + escapeHtml(item.label) + "</span> · atlas link</p>" +
      '<table class="kv"><tbody>' +
      row("Source path", "<code>" + escapeHtml(item.path) + "</code><br>" + github) +
      row("From", escapeHtml(item.from_name || item.from) + " (<code>" + escapeHtml(item.from) + "</code>)") +
      row("To", escapeHtml(item.to_name || item.to) + " (<code>" + escapeHtml(item.to) + "</code>)") +
      textRow("Condition", item.condition) +
      textRow("Status", item.status) +
      textRow("Sources", item.sources) +
      textRow("Window", item.window) +
      "</tbody></table>" +
      (assumptions ? '<h4>Assumptions</h4><ul class="assumptions">' + assumptions + "</ul>" : "") +
      (item.notes ? '<h4>Notes</h4><p class="notes">' + escapeHtml(item.notes) + "</p>" : "")
    );
  }

  function renderCrosslink(item) {
    const github = '<a href="' + escapeHtml(item.github) + '" rel="noopener">Open ' + escapeHtml(item.path) + " on GitHub</a>";
    return (
      "<h3>" + escapeHtml(item.id) + "</h3>" +
      '<p class="lead"><span class="' + pillClass(item.label) + '">' + escapeHtml(item.label) + "</span> · cross-field link</p>" +
      '<p class="quiet">Label stored in the crosslink file. This is not a stage-to-stage atlas link.</p>' +
      '<table class="kv"><tbody>' +
      row("Source path", "<code>" + escapeHtml(item.path) + "</code><br>" + github) +
      textRow("From field", item.a_field) +
      textRow("From pattern", item.a_pattern) +
      textRow("To field", item.b_field) +
      textRow("To pattern", item.b_pattern) +
      textRow("Connection", item.connection) +
      textRow("Support", item.support) +
      textRow("Claim", item.claim) +
      textRow("Breaks if", item.breaks_if) +
      textRow("Evidence rung", item.evidence_rung) +
      textRow("Status", item.status) +
      textRow("Sources", item.sources) +
      textRow("Proposed by", item.proposed_by) +
      textRow("Model exists", item.model_exists === true ? "yes" : item.model_exists === false ? "no" : "") +
      textRow("Model refs", item.model_refs) +
      "</tbody></table>" +
      (item.notes ? '<h4>Notes</h4><p class="notes">' + escapeHtml(item.notes) + "</p>" : "")
    );
  }

  function showDetail(item) {
    const el = $("detail");
    state.selected = item;
    el.hidden = false;
    if (!item) {
      el.innerHTML = '<p class="quiet">Select a card, link or cross-field record to read its fields, label and source path.</p>';
      return;
    }
    el.innerHTML = item.type === "link" ? renderLink(item) : item.type === "crosslink" ? renderCrosslink(item) : renderCard(item);
    el.scrollTop = 0;
    if (window.matchMedia("(max-width: 900px)").matches) {
      el.scrollIntoView({ block: "start" });
    }
  }

  function findItem(type, id) {
    return state.items.find(function (item) { return item.type === type && item.id === id; }) || null;
  }

  function onRoute() {
    const route = parseHash();
    if (route.view === "card" || route.view === "link" || route.view === "crosslink") {
      applyParams(route.params);
      renderList();
      showDetail(findItem(route.view, route.id));
      const current = document.querySelector('.row[aria-current="true"]');
      if (current) current.scrollIntoView({ block: "nearest" });
    } else {
      applyParams(route.params);
      renderList();
    }
  }

  function populateFilters(index) {
    const labels = new Set();
    const topics = new Set();
    index.cards.forEach(function (c) { labels.add(c.label); if (c.factor) topics.add(c.factor); });
    index.links.forEach(function (l) { labels.add(l.label); topics.add(topicOf(l)); });
    (index.crosslinks || []).forEach(function (x) { labels.add(x.label); topics.add(topicOf(x)); });
    const labelSel = $("label");
    LABEL_ORDER.concat(Array.from(labels).sort()).forEach(function (label) {
      if (!labels.has(label)) return;
      if (labelSel.querySelector('option[value="' + label + '"]')) return;
      const opt = document.createElement("option");
      opt.value = label;
      opt.textContent = label;
      labelSel.appendChild(opt);
    });
    const topicSel = $("topic");
    Array.from(topics).sort().forEach(function (topic) {
      const opt = document.createElement("option");
      opt.value = topic;
      opt.textContent = topic;
      topicSel.appendChild(opt);
    });
    const stageSel = $("stage");
    if (stageSel) {
      (index.stages || []).slice().sort(function (a, b) {
        return (a.order == null ? 0 : a.order) - (b.order == null ? 0 : b.order);
      }).forEach(function (stage) {
        const opt = document.createElement("option");
        opt.value = stage.id;
        opt.textContent = stage.name || stage.id;
        stageSel.appendChild(opt);
      });
    }
    const engineSel = $("engine");
    if (engineSel) {
      const engines = new Set();
      index.cards.forEach(function (card) { if (card.engine) engines.add(card.engine); });
      Array.from(engines).sort().forEach(function (engine) {
        const opt = document.createElement("option");
        opt.value = engine;
        opt.textContent = engine;
        engineSel.appendChild(opt);
      });
    }
    const colors = $("label-colors");
    if (colors && !colors.childElementCount) {
      const all = document.createElement("button");
      all.type = "button";
      all.dataset.label = "";
      all.innerHTML = '<span class="pill">All colours</span>';
      all.addEventListener("click", function () {
        $("label").value = "";
        $("label").dispatchEvent(new Event("change"));
      });
      colors.appendChild(all);
      Array.from(labels).sort(function (a, b) {
        return LABEL_ORDER.indexOf(a) - LABEL_ORDER.indexOf(b);
      }).forEach(function (label) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.label = label;
        button.innerHTML = '<span class="' + pillClass(label) + '">' + escapeHtml(label) + "</span>";
        button.addEventListener("click", function () {
          $("label").value = label;
          $("label").dispatchEvent(new Event("change"));
        });
        colors.appendChild(button);
      });
    }
  }

  function syncLabelChips() {
    const colors = $("label-colors");
    if (!colors || !$("label")) return;
    const current = $("label").value || "";
    colors.querySelectorAll("button").forEach(function (button) {
      button.setAttribute("aria-pressed", (button.dataset.label || "") === current ? "true" : "false");
    });
  }

  function bindFilters() {
    ["q", "kind", "label", "topic", "stage", "engine", "sort"].forEach(function (id) {
      const node = $(id);
      if (!node) return;
      const ev = id === "q" ? "input" : "change";
      node.addEventListener(ev, function () {
        if (id === "label") syncLabelChips();
        const route = parseHash();
        const view = (route.view === "card" || route.view === "link" || route.view === "crosslink") ? route.view : "browse";
        const idVal = (view === "card" || view === "link" || view === "crosslink") ? route.id : null;
        writeHash(view, idVal, filterParams(), true);
        renderList();
      });
    });
  }

  function boot() {
    bindFilters();
    window.addEventListener("hashchange", onRoute);
    $("status").textContent = "Loading index…";
    fetch("data/index.json", { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("Could not load data/index.json (" + res.status + ")");
        return res.json();
      })
      .then(function (index) {
        state.index = index;
        state.items = (index.cards || []).concat(index.links || []).concat(index.crosslinks || []);
        populateFilters(index);
        onRoute();
      })
      .catch(function (err) {
        $("status").textContent = "The index failed to load. " + err.message;
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
