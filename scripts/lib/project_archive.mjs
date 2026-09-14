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
import { existsSync, statSync, mkdirSync, cpSync, rmSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { platform } from 'node:process';
import { writeStarterChat, CHAT_STORE } from './starter_chat.mjs';

/**
 * .quadcodeai entries that MUST travel with the project.
 *
 * Deliberately NOT here (they carry the author's machine, not the guide):
 *   .data/documents        — files the author dropped into chat (meeting PDFs,
 *                            internal specs). Never the reader's business.
 *   .data/consoles_state   — 19 terminals pinned to /Users/<author>/...
 *   .data/windows_state    — editor tabs left open on unrelated files
 *   .data/browsers_state   — the author's localhost dev URLs; regenerated below
 *                            from the guide's own `workspace.browserUrl`
 * The IDE recreates all four with sane defaults on first open.
 */
export const QC_INCLUDE = [
  'project.yaml', 'loop.yaml', 'mcp.yaml', 'mcp_ide_server.yaml',
  'custom_commands.yaml', 'browser.yaml', 'console.yaml',
  'filters.yaml', 'dynamic_widgets.yaml', 'additional_context.yaml',
  '.data/gui_state.json',
  '.data/breakpoints_state.json',
];

/**
 * Chat store layout: .data/chats/<name>.files/ holding chat_N.json (metadata,
 * small) + chat_N.jsonl (full message log — can reach hundreds of MB because
 * tool results / media payloads are inlined). Metadata always ships; .jsonl
 * ships only under CHAT_LOG_CAP so one fat chat can't sink the archive.
 */
export const QC_CHATS_DIR = '.data/chats';
export const CHAT_LOG_CAP = 25 * 1024 * 1024; // 25MB per chat_N.jsonl — background chats only

/**
 * gui_state.json's focused_chat_id/focused_chat_section_id is what the IDE
 * opens by default when the project loads. That chat's .jsonl MUST ship in
 * full, uncapped: it IS "the state the author left it in". CHAT_LOG_CAP only
 * exists to stop unrelated old chat history from bloating the archive — it
 * must never silently blank out the one chat the reader actually sees.
 */
function readFocusedChatRef(qcRoot) {
  try {
    const st = JSON.parse(readFileSync(join(qcRoot, '.data/gui_state.json'), 'utf8'));
    if (st.focused_chat_section_id && st.focused_chat_id != null) {
      return { store: st.focused_chat_section_id, name: `chat_${st.focused_chat_id}.jsonl` };
    }
  } catch { /* missing/unreadable gui_state -> no focused chat to protect */ }
  return null;
}

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

/** File tree nodes to expand on open: the guide's own payload, nothing else. */
function expandedTreeFor(payload) {
  const out = new Set();
  for (const rel of payload) {
    const parts = rel.replace(/\\/g, '/').split('/');
    const lastIsFile = parts[parts.length - 1].includes('.');
    const depth = lastIsFile ? parts.length - 1 : parts.length;
    for (let i = 1; i <= depth; i++) out.add(parts.slice(0, i).join('/'));
  }
  return [...out];
}

/**
 * Rebuild the workspace state the reader opens into, from the guide's own spec
 * instead of the author's leftovers.
 *
 * @param {object} workspace  { browserUrl?: string }
 */
function sanitizeWorkspace({ stageRoot, workspace = {} }) {
  const qc = join(stageRoot, '.quadcodeai');

  // A browser window only ships if the guide asks for one, and only at a URL
  // the guide chose — never at the author's localhost port.
  if (workspace.browserUrl) {
    writeFileSync(join(qc, '.data/browsers_state.json'), JSON.stringify({
      standalone_windows: [{
        url: workspace.browserUrl,
        browser_id: 'quadcode:web:browser:id:1',
        geometry: { x: 0, y: 30, width: 1440, height: 900, maximized: false },
      }],
      main_window_browser_tab_viewer: {},
      tab_viewers: [],
      browser_id_counter: 1,
    }), 'utf8');
  }

  // Don't open the reader onto an empty "Web browsers" panel when no browser
  // window ships with the guide.
  const guiStatePath = join(qc, '.data/gui_state.json');
  if (!workspace.browserUrl && existsSync(guiStatePath)) {
    try {
      const st = JSON.parse(readFileSync(guiStatePath, 'utf8'));
      const right = st.tabs_state && st.tabs_state.tabs_right;
      if (right && right.selected === 'Web browsers') {
        right.selected = 'Actions';
        writeFileSync(guiStatePath, JSON.stringify(st), 'utf8');
      }
    } catch { /* unparseable gui_state — leave it, the IDE will heal it */ }
  }

  // filters.yaml carries a per-author whitelist of oversized files that have
  // nothing to do with this guide — reset it, keep the ignore rules.
  const filtersPath = join(qc, 'filters.yaml');
  if (existsSync(filtersPath)) {
    const cleaned = readFileSync(filtersPath, 'utf8')
      .replace(/^whitelist:\s*\n(?:[ \t]*-.*\n?)*/m, 'whitelist: []\n');
    writeFileSync(filtersPath, cleaned, 'utf8');
  }
}

/**
 * Write the curated chat and point the staged gui_state.json at it.
 *
 * The author's gui_state travels with the archive (open tabs, panel layout,
 * window size are all state the reader should inherit), but three fields are
 * author-specific and get rewritten here: which chat is focused, which store
 * it lives in, and which folders the file tree has expanded.
 */
function stageStarterChat({ stageRoot, chat, payload }) {
  const info = writeStarterChat({ stageRoot, chat, store: CHAT_STORE, chatId: 1 });

  const guiStatePath = join(stageRoot, '.quadcodeai/.data/gui_state.json');
  if (existsSync(guiStatePath)) {
    const st = JSON.parse(readFileSync(guiStatePath, 'utf8'));
    st.focused_chat_section_id = info.store;
    st.focused_chat_id = 1;
    st.selected_model_node_id = info.store;
    if (chat.agent) st.last_used_agent = chat.agent;
    st.file_tree_state = { ...(st.file_tree_state || {}), expanded: expandedTreeFor(payload) };
    st.meta_folder_scroll_pos = 0;
    st.file_tree_scroll_pos = 0;
    writeFileSync(guiStatePath, JSON.stringify(st), 'utf8');
  }
  return info;
}

/**
 * Stage a project folder into a staging dir using the whitelist.
 * @param {string} projectRoot  absolute path of the source project
 * @param {string[]} payload    project-relative files/folders the guide needs
 * @param {string} stageRoot    absolute staging dir (wiped first)
 */
export function stageProject({ projectRoot, payload, stageRoot, starterChat = null, workspace = {} }) {
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
  sanitizeWorkspace({ stageRoot, workspace });

  // Preferred path: ship a chat we wrote for the reader, and NONE of the
  // author's real sessions. See stageStarterChat / starter_chat.mjs.
  if (starterChat) {
    report.starterChat = stageStarterChat({ stageRoot, chat: starterChat, payload });
    report.chats = 3; // .chat_version + chat_1.json + chat_1.jsonl
    return report;
  }

  report.notes = report.notes || [];
  report.notes.push(
    'no starterChat defined for this guide — falling back to mirroring the author\'s ' +
    'real chat history. Review the archive before publishing: it may contain internal notes.'
  );

  const focused = readFocusedChatRef(qcRoot);
  let focusedShipped = false;

  const chatsAbs = join(qcRoot, QC_CHATS_DIR);
  if (existsSync(chatsAbs)) {
    for (const store of readdirSync(chatsAbs)) {
      const storeAbs = join(chatsAbs, store);
      if (!statSync(storeAbs).isDirectory()) continue;
      for (const name of readdirSync(storeAbs)) {
        const rel = `${QC_CHATS_DIR}/${store}/${name}`;
        const abs = join(storeAbs, name);
        if (!statSync(abs).isFile()) continue;
        const isFocused = !!focused && store === focused.store && name === focused.name;
        if (name.endsWith('.jsonl') && !isFocused && statSync(abs).size > CHAT_LOG_CAP) {
          report.skipped.push(`${rel} (${humanSize(statSync(abs).size)} > chat log cap, background chat)`);
          continue;
        }
        if (copyInto(qcRoot, rel, join(stageRoot, '.quadcodeai'))) {
          report.chats++;
          if (isFocused) focusedShipped = true;
        }
      }
    }
  }

  if (focused) {
    report.focusedChat = { ...focused, shipped: focusedShipped };
    if (focusedShipped) {
      const focusedAbs = join(chatsAbs, focused.store, focused.name);
      const size = existsSync(focusedAbs) ? statSync(focusedAbs).size : 0;
      report.focusedChat.size = size;
      if (size > CHAT_LOG_CAP) {
        report.notes = report.notes || [];
        report.notes.push(
          `focused chat ${focused.store}/${focused.name} is ${humanSize(size)} (over the ${humanSize(CHAT_LOG_CAP)} ` +
          `background cap) — shipped IN FULL anyway so the reader doesn't open an empty chat pane.`
        );
      }
    } else {
      // Focused chat file doesn't exist on disk at all (deleted/corrupted store).
      // Shipping a gui_state.json that points at nothing produces the exact
      // "empty chat" bug this function exists to prevent — patch it out.
      const guiStatePath = join(stageRoot, '.quadcodeai/.data/gui_state.json');
      if (existsSync(guiStatePath)) {
        try {
          const st = JSON.parse(readFileSync(guiStatePath, 'utf8'));
          delete st.focused_chat_id;
          delete st.focused_chat_section_id;
          writeFileSync(guiStatePath, JSON.stringify(st), 'utf8');
          report.notes = report.notes || [];
          report.notes.push(
            `focused chat ${focused.store}/${focused.name} not found on disk — cleared focused_chat_id ` +
            `in the staged gui_state.json instead of shipping a dangling pointer.`
          );
        } catch { /* if gui_state can't be parsed, leave it — better than crashing the build */ }
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
