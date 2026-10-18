import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/import-shelters.ts"],
  format: "esm",
  target: "node22",
  clean: true,
  // workspace-пакети експортують TS-сорси, тому вбудовуємо їх у бандл
  noExternal: [/^@alerts-shelters\//],
});
