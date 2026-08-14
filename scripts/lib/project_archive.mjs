/**
 * Whitelist builder for downloadable guide projects.
 *
 * The IDE ("Open in IDE") expects a .zip with project files AT THE ROOT,
 * including the .quadcodeai folder so the project opens in the exact state
 * the guide author left it in: chat history, open tabs, browsers, consoles.
 *
 * We ship STATE, not BALLAST. Chat attachments (.files) and file_versions
 * are excluded by decision — they push a single project past 1GB while
 * adding nothing a reader needs to reproduce the guide.
 */
import { existsSync, statSync, mkdirSync, cpSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { platform } from 'node:process';

/** .quadcodeai entries that MUST travel with the project. */
export const QC_INCLUDE = [
  'project.yaml', 'loop.yaml', 'mcp.yaml', 'mcp_ide_server.yaml',
  'custom_commands.yaml', 'browser.yaml', 'console.yaml',
  'filters.yaml', 'dynamic_widgets.yaml', 'additional_context.yaml',
  '.data/gui_state.json',
  '.data/windows_state.json',
  '.data/browsers_state.json',
  '.data/consoles_state.json',
  '.data/breakpoints_state.json',
  '.data/documents',
];

/**
 * Chat store layout: .data/chats/<name>.files/ holding chat_N.json (metadata,
 * small) + chat_N.jsonl (full message log — can reach hundreds of MB because
 * tool results / media payloads are inlined). Metadata always ships; .jsonl
 * ships only under CHAT_LOG_CAP so one fat chat can't sink the archive.
 */
export const QC_CHATS_DIR = '.data/chats';
export const CHAT_LOG_CAP = 25 * 1024 * 1024; // 25MB per chat_N.jsonl

/** Never ship these, whatever else matches. */
export const QC_DENY = [
  /(^|\/)\.data\/file_versions(\/|$)/,
  /(^|\/)\.data\/(cache|logs|tmp)(\/|$)/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)\.git(\/|$)/,
  /(^|\/)\.DS_Store$/,
];

function denied(rel) {
  const p = rel.replace(/\\/g, '/');
  return QC_DENY.some(rx => rx.test(p));
}

function copyInto(srcRoot, rel, stageRoot) {
  const src = join(srcRoot, rel);
  if (!existsSync(src) || denied(rel)) return 0;
  const dst = join(stageRoot, rel);
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(src, dst, {
    recursive: true,
    filter: (s) => !denied(relative(srcRoot, s)),
  });
  return 1;
}

/**
 * Stage a project folder into a staging dir using the whitelist.
 * @param {string} projectRoot  absolute path of the source project
 * @param {string[]} payload    project-relative files/folders the guide needs
 * @param {string} stageRoot    absolute staging dir (wiped first)
 */
export function stageProject({ projectRoot, payload, stageRoot }) {
  rmSync(stageRoot, { recursive: true, force: true });
  mkdirSync(stageRoot, { recursive: true });

  const report = { payload: 0, qc: 0, chats: 0, skipped: [] };

  for (const rel of payload) {
    if (copyInto(projectRoot, rel, stageRoot)) report.payload++;
    else report.skipped.push(rel);
  }

  const qcRoot = join(projectRoot, '.quadcodeai');
  if (!existsSync(qcRoot)) {
    throw new Error('.quadcodeai is missing — the IDE would open a stateless project');
  }
  for (const rel of QC_INCLUDE) {
    if (copyInto(qcRoot, rel, join(stageRoot, '.quadcodeai'))) report.qc++;
  }

  const chatsAbs = join(qcRoot, QC_CHATS_DIR);
  if (existsSync(chatsAbs)) {
    for (const store of readdirSync(chatsAbs)) {
      const storeAbs = join(chatsAbs, store);
      if (!statSync(storeAbs).isDirectory()) continue;
      for (const name of readdirSync(storeAbs)) {
        const rel = `${QC_CHATS_DIR}/${store}/${name}`;
        const abs = join(storeAbs, name);
        if (!statSync(abs).isFile()) continue;
        if (name.endsWith('.jsonl') && statSync(abs).size > CHAT_LOG_CAP) {
          report.skipped.push(`${rel} (${humanSize(statSync(abs).size)} > chat log cap)`);
          continue;
        }
        if (copyInto(qcRoot, rel, join(stageRoot, '.quadcodeai'))) report.chats++;
      }
    }
  }
  return report;
}

/** Zip the staged dir so that its CONTENTS sit at the archive root. */
export function zipStaged(stageRoot, outZip) {
  rmSync(outZip, { force: true });
  mkdirSync(dirname(outZip), { recursive: true });
  if (platform === 'win32') {
    execFileSync('powershell', ['-NoProfile', '-Command',
      `Compress-Archive -Path '${stageRoot}\\*' -DestinationPath '${outZip}' -Force`],
      { stdio: 'inherit' });
  } else {
    execFileSync('zip', ['-r', '-q', '-X', outZip, '.'],
      { cwd: stageRoot, stdio: 'inherit' });
  }
  return statSync(outZip).size;
}

export function humanSize(bytes) {
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
