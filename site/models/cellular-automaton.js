// EXAMPLE DATA. Not family C of Universe Starter. Replace `run` with the physicist's module.
// The picture is not the elementary cellular automaton for `rule`.

const id = "cellular-automaton";
const title = "Cellular automaton";
const family = "C";
const boardTitle = "Parameters";
const summary = "Family C controls. The space-time diagram is an example picture, not rule evaluation.";
const cardIds = ["c.v3o.035.sierpinski-seed.sf-rule"];
const lockNote = "Locked rule and cstart follow c.v3o.035.sierpinski-seed.sf-rule. rev is the engine default false; that card does not set it. The card also sets size 1024 and steps 500, which are not on this board. The picture is not that rule.";
const fidelity = "example";
const engine = { name: "example", version: "0" };

const params = [
  {
    name: "rule",
    label: "Rule",
    min: 0,
    max: 255,
    step: 1,
    default: 90,
    locked: 90,
    unit: "",
    type: "integer",
    scale: "discrete",
    help: "The example picture changes with this number. It does not apply the rule.",
  },
  {
    name: "rev",
    label: "Reversible",
    default: false,
    locked: false,
    unit: "",
    type: "boolean",
    help: "",
  },
  {
    name: "cstart",
    label: "Start",
    default: "seed",
    locked: "seed",
    unit: "",
    type: "enum",
    options: [
      { value: "random", label: "random" },
      { value: "blob", label: "blob" },
      { value: "seed", label: "seed" },
    ],
    help: "",
  },
];

const views = ["spacetime", "series"];

function run(params) {
  const w = 128;
  const h = 96;
  const cells = new Array(w * h).fill(0);
  const rule = Math.max(0, Math.min(255, Math.round(params.rule) || 0));
  const start = params.cstart || "random";
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let on = false;
      if (start === "seed") {
        on = x === (w >> 1) ? true : ((rule >> (y & 7)) & 1) === 1 && ((x + y * 3) & 15) === 0;
      } else if (start === "blob") {
        const inside = Math.abs(x - (w >> 1)) < 18 && y < 14;
        on = inside && ((rule >> ((x + y) & 7)) & 1) === 1;
      } else {
        on = ((rule ^ (x * 3) ^ (y * 5)) & 7) === 0;
      }
      if (params.rev && (y & 1)) on = !on;
      cells[y * w + x] = on ? 1 : 0;
    }
  }
  const series = { t: [], entropy: [] };
  for (let y = 0; y < h; y += 1) {
    let ink = 0;
    for (let x = 0; x < w; x += 1) ink += cells[y * w + x];
    series.t.push(y + 1);
    series.entropy.push(ink / w);
  }
  return {
    example: true,
    fidelity: "example",
    verdict: null,
    note: "Example space-time picture. The entropy slot is the ink fraction of each row of that picture, not an entropy from the engine, and not the result of applying the rule.",
    seriesLabels: { entropy: "Entropy slot (example row ink)" },
    spacetime: { w, h, cells },
    series,
  };
}

export { id, title, family, boardTitle, summary, cardIds, lockNote, fidelity, engine, params, views, run };
