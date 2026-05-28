import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    sourcemap: true,
    dts: true,
    clean: true,
    format: ["cjs", "esm"],
  },
  {
    entry: ["src/cli.ts"],
    sourcemap: true,
    clean: false,
    format: ["esm"],
  },
]);
