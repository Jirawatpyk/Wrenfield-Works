#!/usr/bin/env node
/**
 * PreToolUse hook (Edit|Write|MultiEdit): block edits to secret / credential files.
 *
 * Why: Constitution Principle I + PDPA (FR-030) — secrets must never be committed or
 * modified by the assistant. Reads the tool-call JSON on stdin and, if the target file
 * looks like a secret, returns a PreToolUse "deny" decision. Otherwise stays silent
 * (which is an implicit allow).
 */
import { basename } from 'node:path';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let filePath = '';
  try {
    const data = JSON.parse(input || '{}');
    filePath = (data && data.tool_input && data.tool_input.file_path) || '';
  } catch {
    process.exit(0); // malformed payload: do not block
  }
  if (!filePath) process.exit(0);

  const name = basename(String(filePath).replace(/\\/g, '/')).toLowerCase();
  const blocked =
    name === '.env' ||
    name.startsWith('.env.') ||
    name.endsWith('.pem') ||
    name.endsWith('.key') ||
    name.startsWith('id_rsa') ||
    name.includes('credentials');

  if (blocked) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason:
            `Editing "${name}" is blocked by project policy (secrets / PDPA). ` +
            'Secret and credential files (.env, .env.*, *.pem, *.key, id_rsa, *credentials*) ' +
            'must not be modified by the assistant. Put real values in your local .env only.',
        },
      })
    );
  }
  process.exit(0);
});
