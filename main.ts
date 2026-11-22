// Entry program for "The agent builds a game from one prompt" (Node 22,
// standard library only). It has exactly one job: copy POST.json from the
// repository root into the output directory, where the house reads the
// post's address and fetches its counts from X. The post itself is the
// entry; nothing this program writes about the post is scored.
//
// Run it locally the way the grader does:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(OUTPUT_DIR, { recursive: true });

// The placeholder POST.json ships with a zeroed-out status id; check the
// shape of the address here so a malformed URL fails loudly instead of
// silently at the gate. (The placeholder itself has the right shape and
// copies fine — the gate refuses it later because no such post exists.)
const post = JSON.parse(readFileSync(join(BOT_DIR, "POST.json"), "utf8"));
if (typeof post.url !== "string" || !/^https:\/\/(x\.com|twitter\.com)\/.+\/status\/\d+$/.test(post.url)) {
  console.error(`POST.json does not hold a real X post URL yet: ${post.url}`);
  process.exit(1);
}

try {
  copyFileSync(join(BOT_DIR, "POST.json"), join(OUTPUT_DIR, "POST.json"));
  console.log(`POST.json copied to ${join(OUTPUT_DIR, "POST.json")}`);
} catch (err) {
  console.error(`could not copy POST.json from ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}
