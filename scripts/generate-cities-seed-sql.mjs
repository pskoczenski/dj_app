#!/usr/bin/env node
/**
 * Fetches US cities (population >= 25,000) from the public-domain Plotly sample
 * (github.com/plotly/datasets — us-cities-top-1k.csv; ~1k rows, all large places)
 * and prints INSERT ... ON CONFLICT DO NOTHING for supabase migrations.
 *
 * Run: node scripts/generate-cities-seed-sql.mjs >> supabase/migrations/_seed_fragment.sql
 */

import https from "https";

const PLOTLY_URL =
  "https://raw.githubusercontent.com/plotly/datasets/master/us-cities-top-1k.csv";

const STATE_TO_CODE = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  "District of Columbia": "DC",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}

function sqlEscape(s) {
  return s.replace(/'/g, "''");
}

async function main() {
  const csv = await fetchText(PLOTLY_URL);
  const rows = [];
  const lines = csv.trim().split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // City,State,Population,lat,lon — city may contain commas (join remainder)
    const parts = line.split(",");
    if (parts.length < 5) continue;
    parts.pop(); // lon
    parts.pop(); // lat
    const popPart = parts.pop();
    const stateName = parts.pop()?.trim() ?? "";
    const city = parts.join(",").trim();
    const pop = parseInt(popPart ?? "", 10);
    if (!city || !stateName || Number.isNaN(pop) || pop < 25000) continue;
    const stateCode = STATE_TO_CODE[stateName];
    if (!stateCode) {
      console.error("// skip unknown state:", stateName);
      continue;
    }
    rows.push({
      name: city,
      state_name: stateName,
      state_code: stateCode,
      pop,
    });
  }

  const key = (r) => `${r.name.toLowerCase()}\0${r.state_code}`;
  const byKey = new Map();
  for (const r of rows) {
    const k = key(r);
    const prev = byKey.get(k);
    if (!prev || r.pop > prev.pop) byKey.set(k, r);
  }
  const deduped = [...byKey.values()].sort((a, b) =>
    a.state_code === b.state_code
      ? a.name.localeCompare(b.name)
      : a.state_code.localeCompare(b.state_code),
  );

  console.log(
    "-- ~" +
      deduped.length +
      " cities from Plotly public sample (population filter >= 25,000)",
  );
  console.log("INSERT INTO public.cities (name, state_name, state_code) VALUES");

  const values = deduped.map(
    (r) =>
      `  ('${sqlEscape(r.name)}', '${sqlEscape(r.state_name)}', '${r.state_code}')`,
  );
  console.log(values.join(",\n"));
  console.log("ON CONFLICT (name, state_code) DO NOTHING;");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
