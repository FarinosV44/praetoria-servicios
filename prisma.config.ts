import path from "node:path";
import "dotenv/config"; // `dotenv` is a runtime dependency so this also works
import { defineConfig } from "prisma/config"; // during a production install on a deploy host

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
