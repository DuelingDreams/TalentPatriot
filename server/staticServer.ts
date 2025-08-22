import express, { type Express } from "express";
import path from "node:path";
import fs from "node:fs";

export function serveDualPathStatic(app: Express) {
  const candidates = [
    // Running from TypeScript sources (e.g., ts-node/replit): dist is one level up
    path.resolve(import.meta.dirname, "../dist/public"),
    // Running from compiled dist/ (e.g., node dist/server/index.js): public is next to compiled file
    path.resolve(import.meta.dirname, "public"),
  ];
  const distPath = candidates.find(p => fs.existsSync(p));

  if (!distPath) {
    const tried = candidates.map(p => `- ${p}`).join("\n");
    throw new Error(
      "Static build not found. Please run `npm run build`.\nLooked in:\n" + tried
    );
  }

  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}