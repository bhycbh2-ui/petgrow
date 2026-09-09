import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToString } from "react-dom/server";
import { transform } from "esbuild";
import createSplitter from "../build/petgrow-deep-screen-split-v7-20260821.mjs";

test("lazy result renders even when parent chart bindings have not loaded", async () => {
  const source = fs.readFileSync(new URL("../build/petgrow-deep-screen-split-v7-20260821.mjs", import.meta.url), "utf8");
  const names = [...source.matchAll(/functions:\s*\[([\s\S]*?)\]/g)]
    .flatMap((match) => [...match[1].matchAll(/"([A-Za-z0-9_]+)"/g)].map((item) => item[1]));
  const fixture = "let ResponsiveContainer;\n" + names.map((name) =>
    name === "ResultPage"
      ? "function ResultPage(){return <ResponsiveContainer width={300} height={200}><div /></ResponsiveContainer>;}"
      : `function ${name}(){return null;}`
  ).join("\n");
  const plugin = createSplitter();
  const context = { error(message) { throw new Error(message); } };
  plugin.transform.call(context, fixture, "/app/src/App.jsx");
  const result = await plugin.load.call(context, plugin.resolveId("virtual:petgrow-v7-result"));
  const compiled = await transform(result.code, { format: "cjs", platform: "node" });
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled.code)(createRequire(import.meta.url), module, module.exports);
  // The parent can pass its original undefined snapshot after the gate loads.
  const html = renderToString(React.createElement(module.exports.default, {
    __deps: { ResponsiveContainer: undefined },
  }));
  assert.match(html, /recharts-responsive-container/);
});
