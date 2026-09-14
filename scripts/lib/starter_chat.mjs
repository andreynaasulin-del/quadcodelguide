/**
 * Curated starter chat for downloadable guide projects.
 *
 * WHY THIS EXISTS
 * The IDE opens whatever `.quadcodeai/.data/gui_state.json` points at. Shipping
 * the author's real working session solves "empty chat pane" but creates two
 * worse problems: it leaks internal dev history (pins, unrelated projects,
 * rejected work, secrets typed in passing) and it drags hundreds of megabytes
 * of inlined tool output into every download.
 *
 * So the archive carries a chat we WROTE, not a chat we RECORDED: a short,
 * hand-authored briefing that tells the reader what the project is and what to
 * ask next. It is part of the guide, reviewed like copy — not an artifact.
 *
 * On-disk format (verified against a live store, .chat_version 5):
 *   .data/chats/<store>/.chat_version   {"version": 5}
 *   .data/chats/<store>/chat_<id>.json  metadata: topic, agent, pins
 *   .data/chats/<store>/chat_<id>.jsonl one JSON object per message
 * Message methods are "USER" (the human) and "LLM" (the agent).
 */
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

/** Chat store folder name. Must match gui_state.selected_model_node_id. */
export const CHAT_STORE = 'r4.files';
export const CHAT_VERSION = 5;

/** IDE timestamps are naive ISO with microseconds: 2026-08-15T06:35:27.862155 */
function stamp(date) {
  return date.toISOString().replace('Z', '') + '000';
}

/**
 * Build one message line in the IDE's chat log format.
 * Every field the reader's IDE expects is written explicitly — a missing key
 * is a silently broken chat pane, which is the bug this module was born from.
 */
function messageLine({ name, text, method, timestamp }) {
  return {
    name,
    message: text,
    message_raw: text,
    method,
    tasks: '',
    is_status_message: false,
    message_id: randomUUID(),
    timestamp: stamp(timestamp),
    variation_index: 0,
    variations: [],
    images_data: {},
    documents_data: {},
    hidden_from_agent: false,
    model_auto_switched: false,
  };
}

/**
 * Write a curated starter chat into the staged .quadcodeai folder.
 *
 * @param {string} stageRoot  staging dir (archive root)
 * @param {object} chat       { topic, agent?, user?, messages: [{from:'user'|'agent', text}] }
 * @param {string} store      chat store folder name
 * @param {number} chatId     chat number; 1 keeps the reader's history clean
 * @returns {{store:string,name:string,messages:number,size:number}}
 */
export function writeStarterChat({ stageRoot, chat, store = CHAT_STORE, chatId = 1 }) {
  if (!chat || !Array.isArray(chat.messages) || chat.messages.length === 0) {
    throw new Error('starterChat needs a non-empty messages array');
  }

  const agent = chat.agent || 'Cody';
  const user = chat.user || 'PO';
  const dir = join(stageRoot, '.quadcodeai/.data/chats', store);
  mkdirSync(dir, { recursive: true });

  // Space the messages a minute apart so the transcript reads as a conversation
  // rather than a batch import with identical timestamps.
  const base = chat.date ? new Date(chat.date) : new Date();
  const lines = chat.messages.map((m, i) => {
    const isUser = m.from !== 'agent';
    return messageLine({
      name: isUser ? user : agent,
      text: m.text,
      method: isUser ? 'USER' : 'LLM',
      timestamp: new Date(base.getTime() + i * 60_000),
    });
  });

  const jsonlPath = join(dir, `chat_${chatId}.jsonl`);
  writeFileSync(jsonlPath, lines.map((l) => JSON.stringify(l)).join('\n') + '\n', 'utf8');

  // pins stay empty on purpose: pins are the author's private working memory.
  writeFileSync(join(dir, `chat_${chatId}.json`), JSON.stringify({
    chat_id: chatId,
    topic: chat.topic,
    user_topic: '',
    focus_section_id: store,
    last_agent_name: agent,
    last_modified_datetime: stamp(new Date(base.getTime() + lines.length * 60_000)),
    mentioned_files: chat.mentioned_files || [],
    additional_context: '',
    pins: {},
  }), 'utf8');

  writeFileSync(join(dir, '.chat_version'), JSON.stringify({ version: CHAT_VERSION }), 'utf8');

  return { store, name: `chat_${chatId}.jsonl`, messages: lines.length, size: statSync(jsonlPath).size };
}
