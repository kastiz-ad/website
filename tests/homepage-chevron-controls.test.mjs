import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const script = fs.readFileSync("script.js", "utf8");

test("homepage language and theme controls use CSS chevrons, not question-mark glyphs", () => {
  assert.equal(html.includes('<span class="nav-arrow">?</span>'), false);
  assert.equal(html.includes("\ufffd"), false);
  const arrowMatches = [...html.matchAll(/<span class="nav-arrow" aria-hidden="true"><\/span>/g)];
  assert.equal(arrowMatches.length, 2, "homepage should render exactly one decorative chevron for theme and language");
});

test("theme and language controls preserve accessible names", () => {
  assert.match(html, /<button class="nav-text-trigger" id="themeControl"[^>]*aria-haspopup="true"[^>]*aria-expanded="false"/);
  assert.match(html, /<span id="themeControlText">Light<\/span>/);
  assert.match(html, /<button class="nav-text-trigger" id="languageControl"[^>]*aria-haspopup="true"[^>]*aria-expanded="false"/);
  assert.match(html, /<span id="languageControlText">English<\/span>/);
});

test("dropdown indicator is drawn with CSS borders and rotates on open", () => {
  assert.match(css, /\.nav-text-trigger \.nav-arrow\s*\{[\s\S]*border-right:\s*1\.6px solid currentColor/);
  assert.match(css, /\.nav-text-trigger \.nav-arrow\s*\{[\s\S]*border-bottom:\s*1\.6px solid currentColor/);
  assert.match(css, /\.nav-dropdown\.is-open\s*>\s*\.nav-text-trigger \.nav-arrow\s*\{[\s\S]*rotate\(225deg\)/);
  assert.equal(/\.nav-arrow\s*\{[\s\S]*content:\s*["']\?/.test(css), false);
});

test("desktop and responsive/mobile navigation share the same controls", () => {
  assert.equal((html.match(/id="themeControl"/g) || []).length, 1);
  assert.equal((html.match(/id="languageControl"/g) || []).length, 1);
  assert.match(css, /@media[\s\S]*\.nav-dropdown-menu/);
});

test("public homepage references updated cache-busted assets", () => {
  assert.match(html, /style\.css\?v=20260810-release-preview-fallback/);
  assert.match(html, /script\.js\?v=20260810-release-preview-fallback/);
  assert.match(script, /home-page\.js\?v=20260810-release-preview-fallback/);
});
