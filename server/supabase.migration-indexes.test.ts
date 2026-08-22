import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Supabase foreign-key index migration", () => {
  it("covers every foreign key reported by the performance advisor", () => {
    const migration = readFileSync(
      resolve(process.cwd(), "supabase/migrations/0003_add_foreign_key_covering_indexes.sql"),
      "utf8",
    );

    expect(migration).toContain("bug_reports_device_id_idx");
    expect(migration).toContain("bug_reports_duplicate_of_id_idx");
    expect(migration).toContain("bug_reports_triaged_by_idx");
    expect(migration).toContain("reputation_events_bug_report_id_idx");
    expect(migration).toContain("if not exists");
  });
});
