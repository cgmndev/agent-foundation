// Frontmatter utilities shared by hashing, drift checks and the skills' CLIs.
// Hash contract (docs/foundation/12-guia-specs.md §2): SHA-256 over the file
// content WITH the frontmatter block stripped, so the hash can live inside
// the file without a circular dependency. Stamping frontmatter fields never
// changes a file's own body hash.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

export function split(content) {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: null, body: content };
  return { frontmatter: match[1], body: content.slice(match[0].length) };
}

export function getField(content, key) {
  const { frontmatter } = split(content);
  if (frontmatter == null) return null;
  const line = frontmatter.split('\n').find((l) => l.startsWith(key + ':'));
  if (!line) return null;
  // Strip inline template comments ("# ...") and quotes.
  const raw = line.slice(key.length + 1).split(' #')[0].trim();
  const value = raw.replace(/^["']|["']$/g, '');
  return value === 'null' || value === '' ? null : value;
}

export function setField(path, key, value) {
  const content = readFileSync(path, 'utf8');
  const { frontmatter, body } = split(content);
  if (frontmatter == null) throw new Error(`no frontmatter in ${path}`);
  const lines = frontmatter.split('\n');
  const index = lines.findIndex((l) => l.startsWith(key + ':'));
  const newLine = `${key}: ${value}`;
  if (index >= 0) lines[index] = newLine;
  else lines.push(newLine);
  writeFileSync(path, `---\n${lines.join('\n')}\n---\n${body}`);
}

export function bodyHash(path) {
  const { body } = split(readFileSync(path, 'utf8'));
  return createHash('sha256').update(body).digest('hex');
}
