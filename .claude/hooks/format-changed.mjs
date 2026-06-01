#!/usr/bin/env node
/**
 * PostToolUse hook (Edit|Write|MultiEdit): format + lint the changed file IF the
 * project toolchain is installed. No-ops cleanly before the project is scaffolded.
 *
 * - Runs Prettier (--write) on supported files, then ESLint (--fix) on JS/TS files.
 * - Type-checking (tsc) is intentionally NOT run here — a full type-check per edit is
 *   slow (Constitution V: keep the dev loop fast); it belongs in CI / pre-commit.
 * - NEVER blocks: always exits 0 and swallows tool errors (formatting is best-effort).
 */
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const done = () => process.exit(0);

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const filePath =
      (data && data.tool_input && data.tool_input.file_path) ||
      (data && data.tool_response && data.tool_response.filePath) ||
      '';
    if (!filePath) return done();

    const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();

    // Toolchain gate: no package.json or no installed deps → no-op (pre-scaffold).
    if (!existsSync(join(root, 'package.json')) || !existsSync(join(root, 'node_modules'))) {
      return done();
    }

    const ext = String(filePath).split('.').pop().toLowerCase();
    const formatExts = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'css', 'scss', 'md', 'mdx'];
    const codeExts = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'];

    const bin = (n) =>
      join(root, 'node_modules', '.bin', process.platform === 'win32' ? `${n}.cmd` : n);
    const run = (cmd, args) => {
      try {
        execFileSync(cmd, args, { cwd: root, stdio: 'ignore' });
      } catch {
        /* report-only; formatting/lint failures must not block the edit */
      }
    };

    if (formatExts.includes(ext) && existsSync(bin('prettier'))) {
      run(bin('prettier'), ['--write', '--ignore-unknown', filePath]);
    }
    if (codeExts.includes(ext) && existsSync(bin('eslint'))) {
      run(bin('eslint'), ['--fix', filePath]);
    }
    done();
  } catch {
    done();
  }
});
