import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { TABLES, VIEWS } from "@/lib/db/schema-constants";

const migrationsDir = join(process.cwd(), "supabase/migrations");

let sql: string;

beforeAll(() => {
  sql = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(migrationsDir, f), "utf-8"))
    .join("\n");
});

describe("Migration file guardrails", () => {
  it.each(Object.values(TABLES))("creates table %s", (table) => {
    expect(sql).toContain(`CREATE TABLE ${table}`);
  });

  it.each(Object.values(TABLES))(
    "enables RLS on %s",
    (table) => {
      expect(sql).toContain(
        `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`
      );
    }
  );

  it("creates at least one policy per table", () => {
    for (const table of Object.values(TABLES)) {
      expect(sql).toContain(`ON ${table} FOR`);
    }
  });

  it("creates the profile_follow_counts view", () => {
    expect(sql).toContain(
      `CREATE VIEW ${VIEWS.profileFollowCounts}`
    );
  });

  it("creates the upsert_genre_tags function", () => {
    expect(sql).toContain("upsert_genre_tags");
    expect(sql).toContain("SECURITY DEFINER");
  });

  it("creates the update_updated_at trigger function", () => {
    expect(sql).toContain("CREATE OR REPLACE FUNCTION update_updated_at()");
  });
});
