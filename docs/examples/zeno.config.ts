// this file lives in project root
// @ts-nocheck

import { defineConfig } from "@zeno/core";

export default defineConfig({
  // Project paths
  schemaDir: "./zeno",
  outputDir: "./src",

  // Database configuration
  database: {
    provider: "postgresql",
    connection: process.env.DATABASE_URL!,
    migrations: {
      dir: "./drizzle",
      auto: false,
    },
  },

  // Generation controls
  generate: {
    models: true,
    components: true,
    pages: true,
    api: true,
    navigation: true,
  },
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST!,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  },

  // Development options
  dev: {
    watch: true,
    verbose: false,
  },
});
