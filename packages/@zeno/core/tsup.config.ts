import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["node:*"],
  treeshake: true,
  target: "es2022",
  outDir: "dist",
  splitting: false,
  minify: false,
});
