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

  it("adds genres master table and removes legacy upsert_genre_tags / genre_tags", () => {
    expect(sql).toContain("CREATE TABLE genres");
    expect(sql).toContain("DROP FUNCTION IF EXISTS upsert_genre_tags");
    expect(sql).toContain("DROP TABLE IF EXISTS genre_tags");
    expect(sql).toContain("genre_ids");
  });

  it("creates the update_updated_at trigger function", () => {
    expect(sql).toContain("CREATE OR REPLACE FUNCTION update_updated_at()");
  });

  it("creates comments schema essentials", () => {
    expect(sql).toContain("CREATE TYPE commentable_type AS ENUM ('event', 'mix')");
    expect(sql).toContain("CREATE TABLE comments");
    expect(sql).toContain("CREATE TABLE comment_likes");
    expect(sql).toContain("UNIQUE(comment_id, profile_id)");
    expect(sql).toContain("CREATE INDEX idx_comments_commentable");
    expect(sql).toContain("CREATE TRIGGER comments_updated_at");
  });

  it("adds comments and comment_likes RLS policies", () => {
    expect(sql).toContain("Authenticated users can view active comments");
    expect(sql).toContain("Authors can update own comments");
    expect(sql).toContain("Users can like comments as themselves");
    expect(sql).toContain("Users can remove own comment likes");
  });

  it("adds conversation_participants INSERT helper and last_read_at UPDATE policy (00022)", () => {
    expect(sql).toContain("can_insert_conversation_participant");
    expect(sql).toContain("Eligible event members can add participants");
    expect(sql).toContain("Participants can update own last_read_at");
    expect(sql).toContain("conversation_participants_immutable");
  });

  it("adds cities table with trigram index and authenticated read policy", () => {
    expect(sql).toContain("CREATE TABLE cities");
    expect(sql).toContain("CREATE EXTENSION IF NOT EXISTS pg_trgm");
    expect(sql).toContain("gin (name gin_trgm_ops)");
    expect(sql).toContain("idx_cities_name_state");
    expect(sql).toContain("Cities are readable by authenticated users");
    expect(sql).toContain("profiles");
    expect(sql).toContain("city_id");
    expect(sql).toContain("ALTER TABLE profiles");
    expect(sql).toContain("DROP COLUMN city");
  });
});
