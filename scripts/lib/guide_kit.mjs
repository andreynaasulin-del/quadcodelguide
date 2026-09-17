/**
 * Guide kit: the project a reader gets when they click "Open in Quadcode"
 * under ONE guide. Generated from the guide's own entry in guides.json — no
 * hand-written spec needed.
 *
 * WHY THIS SHAPE (PO review, 2026-09-16)
 * The first version handed every reader the whole site repository with a
 * "map of the repo" chat full of file paths and links. A reader who had just
 * watched a 15-second vlog on the guide page landed in that chat, saw no
 * video and no prompt, closed the IDE and left. The kit fixes the format:
 *
 *   README.md          one page: what this is, 3 steps to make it yourself,
 *                      every prompt in order, where each result file is
 *   prompts/NN-*.txt   the prompts, verbatim, one file per step (copy-paste)
 *   result/            the actual media from the guide — final render plus
 *                      the per-step frames/excerpts the page shows
 *   sources/           only when the guide shipped a widget/build (iframe)
 *   .quadcodeai chat   a re-enacted making-of: the prompt as a user message,
 *                      the result (media) as the agent's reply, step by step.
 *                      Nothing to click through — the reader scrolls a chat
 *                      that already shows prompt → result and ends on
 *                      "paste any of these to make your own".
 *
 * No links to the site, no repo map. If a reader wants the site sources they
 * still have the site-wide archive; this kit is about ONE result.
 */
import { existsSync, statSync, readFileSync } from 'node:fs';
import { basename, extname, join, posix } from 'node:path';
import { REPO_ROOT, isRemoteUrl } from './media.mjs';

/** Which agent "made" the guide, so the chat opens with the right specialist. */
export function agentForGuide(g) {
  const models = String(g.models || '');
  const cat = String(g.cat || '');
  // Code-first guides (interactive builds) go to Cody regardless of media.
  if (/Interfaces|Website/i.test(cat) || /agent|three\.js|webgl|html|react|sonnet/i.test(models)) return 'Cody';
  // What the reader will actually be generating decides the agent: the final
  // deliverable's media type first, then the model names, then the category.
  if (g.video || g.audio) return 'Sonic';
  if (g.image) return 'Lumi';
  if (/video|music|audio|sound|voice|seedance|veo|kling|suno|topaz/i.test(models)) return 'Sonic';
  if (/image|flux|meshy|trellis/i.test(models)) return 'Lumi';
  if (/Video|Music|Motion/i.test(cat)) return 'Sonic';
  if (/Design/i.test(cat)) return 'Lumi';
  return 'Cody';
}

/** Where the reader pastes a prompt, in words that match the IDE UI. */
function whereToPaste(agent) {
  return `the chat on the left (agent: ${agent})`;
}

export function slug(s, max = 48) {
  return String(s || '')
    .toLowerCase()
    .replace(/['"’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '') || 'step';
}

/**
 * Project folder name the IDE creates on the reader's machine. Titles carry
 * colons and quotes; those break on Windows and render as "/" in Finder.
 */
export function projectNameFor(g) {
  const t = String(g.title || g.id)
    .replace(/[:|]/g, ' —')
    .replace(/[<>"?*\\/]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Long titles: keep the first clause (before " — ", ". " or ", ") when it
  // fits, otherwise cut on a word. Never a mid-sentence ellipsis — this string
  // is the project's folder name and shows in the IDE's project switcher.
  let short = t;
  if (t.length > 64) {
    const clause = t.split(/\s[—–-]\s|\.\s|,\s/)[0].trim();
    short = clause.length >= 16 ? clause : t.slice(0, 64).replace(/\s+\S*$/, '');
  }
  return `Guide — ${short}`;
}

function localAbs(v) {
  if (!v || isRemoteUrl(v)) return null;
  const abs = join(REPO_ROOT, String(v).replace(/^\//, ''));
  return existsSync(abs) && statSync(abs).isFile() ? abs : null;
}

function relFromAbs(abs) {
  return abs.slice(REPO_ROOT.length + 1).replace(/\\/g, '/');
}

const isVideo = (p) => /\.(mp4|webm|mov)$/i.test(p);
const isAudio = (p) => /\.(mp3|wav|m4a|ogg)$/i.test(p);
const isImage = (p) => /\.(png|jpe?g|webp|gif|svg)$/i.test(p);

function kindOf(p) {
  if (isVideo(p)) return 'video';
  if (isAudio(p)) return 'audio';
  if (isImage(p)) return 'image';
  return 'file';
}

/**
 * Markdown that shows a result file in the README.
 *
 * A still is shown. A clip is named and pointed at — the poster is the guide's
 * cover art, not a substitute for the video, and dropping it here as if it
 * were the result is the move that makes a kit look thrown together. The file
 * is already open in an editor tab when the project loads.
 */
function mediaMd(dest, poster, caption) {
  const kind = kindOf(dest);
  if (kind === 'image') return `![${caption || basename(dest)}](${dest})`;
  if (kind === 'video') return `▶︎ \`${dest}\` — plays in the editor tab on the right`;
  if (kind === 'audio') return `♪ \`${dest}\` — plays in the editor tab on the right`;
  return `\`${dest}\``;
}

/**
 * Build the kit spec for one guide.
 * @returns {{ projectName, payload:[{src,dest}], extraFiles:[{dest,content}], starterChat, workspace }}
 */
export function guideKitSpec(g, { sources = [] } = {}) {
  const agent = agentForGuide(g);
  const payload = [];     // {src: repo-relative, dest: kit-relative}
  const seen = new Map(); // repo-relative -> dest (dedupe: final clip often repeats in last step)
  const missing = [];

  const absOfDest = new Map(); // kit-relative dest -> absolute source path

  function ship(value, dest) {
    if (!value) return null;
    const abs = localAbs(value);
    if (!abs) { missing.push(String(value)); return null; }
    const src = relFromAbs(abs);
    if (seen.has(src)) return seen.get(src);
    seen.set(src, dest);
    absOfDest.set(dest, abs);
    payload.push({ src, dest });
    return dest;
  }

  /**
   * Base64 of a shipped image, for inline display in the chat. Big stills
   * (design sheets, plans) stay as files only — the chat log is loaded whole.
   */
  const INLINE_CAP = 700 * 1024;
  // The whole transcript is parsed on open, so the sum matters as much as any
  // single picture. Past this budget the remaining results stay file-only —
  // they are already open one click away in the editor.
  const INLINE_BUDGET = 3 * 1024 * 1024;
  let inlineSpent = 0;
  function inlineB64(dest) {
    const abs = dest && absOfDest.get(dest);
    if (!abs || !isImage(dest)) return null;
    const size = statSync(abs).size;
    if (size > INLINE_CAP || inlineSpent + size > INLINE_BUDGET) return null;
    inlineSpent += size;
    return readFileSync(abs).toString('base64');
  }

  // ---- final result (guide-level media)
  const finalMedia = g.video || g.audio || g.image || null;
  const finalExt = finalMedia ? extname(finalMedia) : '';
  const finalDest = finalMedia ? ship(finalMedia, `result/final${finalExt}`) : null;
  const finalPoster = g.poster && isVideo(finalMedia || '') ? ship(g.poster, `result/final-poster${extname(g.poster)}`) : null;
  if (!finalMedia && g.poster) ship(g.poster, `result/final${extname(g.poster)}`);

  // ---- steps: prompt + result, in order
  const steps = (g.steps || []).map((s, i) => {
    const n = i + 1;
    const nn = String(n).padStart(2, '0');
    const media = s.result_video || s.result_audio || s.result_image || null;
    let dest = null, poster = null;
    if (media) {
      dest = ship(media, `result/step-${n}${extname(media)}`);
      if (s.result_poster && isVideo(media)) poster = ship(s.result_poster, `result/step-${n}-poster${extname(s.result_poster)}`);
    }
    // One prompt can return a set (three directions, five carousel slides).
    // Ship the whole set, suffixed a/b/c…, so the kit carries the same
    // evidence the guide page shows.
    const dests = [];
    if (Array.isArray(s.result_images)) {
      s.result_images.forEach((m, k) => {
        const src = typeof m === 'string' ? m : m.src;
        const d = ship(src, `result/step-${n}${String.fromCharCode(97 + k)}${extname(src)}`);
        if (d) dests.push({ dest: d, label: (typeof m === 'string' ? '' : m.label) || '' });
      });
    }
    const prompt = (s.prompt || '').trim();
    const title = String(s.title || `Step ${n}`).replace(/^\d+[.)]\s*/, '');
    return {
      n, nn,
      title,
      text: (s.text || '').trim(),
      prompt,
      promptFile: prompt ? `prompts/${nn}-${slug(title)}.txt` : null,
      dest, poster, dests,
      caption: (s.result_caption || '').trim(),
      label: (s.result_label || '').trim(),
    };
  });

  // ---- downloads (GLBs, PDFs, widget html) → result/downloads/
  for (const d of g.downloads || []) {
    if (d && d.file) ship(d.file, `result/downloads/${basename(d.file)}`);
  }

  const promptSteps = steps.filter(s => s.prompt);
  const extraFiles = [];

  // ---- widgets / builds the guide embeds → sources/
  // Widget HTML references its assets by site-absolute path (/ui_views/assets/x.glb).
  // Ship every such asset that exists and rewrite the reference so the file
  // works when opened from the kit folder, not just on the site.
  const widgetFiles = [];
  for (const s of g.steps || []) {
    if (!s.widget_iframe) continue;
    const abs = localAbs(s.widget_iframe);
    if (!abs) { missing.push(String(s.widget_iframe)); continue; }
    const dest = `sources/${basename(s.widget_iframe)}`;
    let html = readFileSync(abs, 'utf8');
    html = html.replace(/\/ui_views\/assets\/([A-Za-z0-9._\-\/]+)/g, (m, rel) => {
      const shipped = ship(`ui_views/assets/${rel}`, `sources/assets/${basename(rel)}`);
      return shipped ? posix.relative('sources', shipped) : m;
    });
    extraFiles.push({ dest, content: html });
    widgetFiles.push(dest);
  }
  for (const src of sources) payload.push(typeof src === 'string' ? { src, dest: src } : src);

  for (const s of promptSteps) extraFiles.push({ dest: s.promptFile, content: s.prompt + '\n' });

  const sourcesShipped = widgetFiles.length > 0 || payload.some(p => p.dest.startsWith('sources/'));
  extraFiles.push({ dest: 'README.md', content: readmeFor(g, { agent, steps, finalDest, finalPoster, promptSteps, sourcesShipped, widgetFiles }) });

  const starterChat = chatFor(g, { agent, steps, finalDest, finalPoster, promptSteps, widgetFiles, inlineB64 });

  const expanded = ['result', ...(promptSteps.length ? ['prompts'] : []), ...(sourcesShipped ? ['sources'] : [])];

  // The reader lands on the result itself: README in one tab, the final file
  // in the other, video/image in front. Audio has no picture — README leads.
  const openFiles = ['README.md', ...(finalDest ? [finalDest] : []), ...widgetFiles];
  const currentFile = finalDest && !isAudio(finalDest) ? finalDest : 'README.md';

  const projectName = projectNameFor(g);
  return {
    projectName,
    payload,
    extraFiles,
    starterChat,
    workspace: {
      expanded,
      rightTab: 'File editors',
      openFiles,
      currentFile,
      projectName,
      additionalContext: agentContextFor(g, { agent, promptSteps, finalDest, widgetFiles }),
    },
    missing,
  };
}

/**
 * What the agent is told about this folder on every turn. Short, factual, and
 * aimed at the one thing the reader will do: paste a prompt and expect a file.
 */
function agentContextFor(g, { agent, promptSteps, finalDest, widgetFiles }) {
  const L = [];
  L.push(`This project is a guide kit from guides.quadcode.ai: "${g.title}".`);
  if (finalDest) L.push(`The finished result is ${finalDest}; per-step results are in result/.`);
  if (promptSteps.length) {
    L.push(`prompts/ holds the ${promptSteps.length} prompt(s) that produced it, numbered in order.`);
    L.push('When the user pastes one of these prompts (or a variation of it), they want their OWN version generated ' +
      `with ${agent}'s tools — run it, save the output next to result/, and show it. Do not explain the prompt back to them.`);
  }
  else {
    // Nothing to paste here. Without this line the agent invents a prompt when
    // the user asks "how do I do this", which is exactly the wrong answer for
    // a piece that was made in the capture and the edit.
    L.push('This guide has NO prompts — the piece was made by capture and editing, not text-to-media. ' +
      'If the user wants their own version, work from their footage/stills and apply the mechanism described in README.md step by step. Never invent a prompt for it.');
  }
  if (widgetFiles.length) L.push(`sources/ holds the interactive build (${widgetFiles.join(', ')}); its asset paths are relative to sources/.`);
  L.push('Keep answers short. The user is following a tutorial, not asking for a lecture.');
  return L.join(' ');
}

// ------------------------------------------------------------------ README

function readmeFor(g, { agent, steps, finalDest, finalPoster, promptSteps, sourcesShipped, widgetFiles = [] }) {
  const L = [];
  L.push(`# ${g.title}`);
  L.push('');
  if (g.desc) { L.push(g.desc); L.push(''); }

  if (finalDest) {
    L.push('## The result');
    L.push('');
    // The cover frame appears once, at the top, where it works as key art —
    // never further down standing in for a clip the reader should be playing.
    if (finalPoster) { L.push(`![${g.title}](${finalPoster})`); L.push(''); }
    L.push(mediaMd(finalDest, finalPoster, g.title));
    if (g.result) { L.push(''); L.push(g.result); }
    L.push('');
  }

  L.push('## Make it yourself');
  L.push('');
  if (promptSteps.length) {
    L.push(`1. Open ${whereToPaste(agent)}.`);
    L.push(`2. Paste **prompt 1** below (also in \`${promptSteps[0].promptFile}\`) and send it.`);
    if (promptSteps.length > 1) {
      L.push(`3. When the result comes back, send the next prompt. ${promptSteps.length} prompts in total, in order.`);
      L.push(`4. Compare with \`${finalDest || 'result/'}\` — then change the parts that should be yours.`);
    } else {
      L.push(`3. Compare with \`${finalDest || 'result/'}\` — then change the parts that should be yours.`);
    }
  } else {
    // "It's a build, not a prompt run" told the reader what this ISN'T. Give
    // them the same three-step path the prompt kits get, pointed at the
    // mechanism instead of a paste buffer.
    const first = steps.find(s => s.title);
    L.push(`1. Watch/read the result above, then read the steps below — each one carries the frame or excerpt that proves it.`);
    L.push(`2. Open ${whereToPaste(agent)} and say what you have (your own scans, footage or stills).`);
    L.push(`3. Work the mechanism in order${first ? `, starting with "${first.title}"` : ''}. There is no prompt to paste: this piece was made in the capture and the edit.`);
    if (sourcesShipped) L.push('4. `sources/` holds the build itself if you would rather start from the working files.');
  }
  L.push('');

  // Every result file already embedded above, so the closing strip does not
  // repeat pictures the reader has just scrolled past.
  const shown = new Set();
  L.push('## Steps');
  L.push('');
  for (const s of steps) {
    L.push(`### ${s.n}. ${s.title}`);
    L.push('');
    if (s.text) { L.push(s.text); L.push(''); }
    if (s.prompt) {
      L.push(`**Prompt** (\`${s.promptFile}\`):`);
      L.push('');
      L.push('```');
      L.push(s.prompt);
      L.push('```');
      L.push('');
    }
    if (s.dest) {
      L.push(`**Result**${s.label ? ` — ${s.label}` : ''}:`);
      L.push('');
      L.push(mediaMd(s.dest, s.poster, s.title));
      shown.add(s.dest);
      if (s.caption) { L.push(''); L.push(`_${s.caption}_`); }
      L.push('');
    } else if (s.dests && s.dests.length) {
      L.push(`**Result**${s.label ? ` — ${s.label}` : ''}:`);
      L.push('');
      // A README is read top to bottom. If the frames already appeared as
      // their own steps above, print the strip as a list of links — embedding
      // the same five pictures a second time is padding, not evidence.
      const fresh = s.dests.filter(d => !shown.has(d.dest));
      if (fresh.length) {
        for (const d of s.dests) { L.push(`![${d.label || basename(d.dest)}](${d.dest})`); shown.add(d.dest); }
      } else {
        L.push(s.dests.map((d, i) => `${i + 1}. [${d.label || basename(d.dest)}](${d.dest})`).join('  \n'));
      }
      if (s.caption) { L.push(''); L.push(`_${s.caption}_`); }
      L.push('');
    }
  }

  L.push('## Files');
  L.push('');
  L.push('- `result/` — the media from the guide page: the final render and the per-step frames.');
  if (promptSteps.length) L.push('- `prompts/` — every prompt as a text file, in order.');
  if (sourcesShipped) {
    L.push('- `sources/` — the widget/build the guide embeds' +
      (widgetFiles.length
        ? `. Open \`${widgetFiles[0]}\` in a browser. If 3D models refuse to load from a file:// page, serve the folder ` +
          'first: `python3 -m http.server 8000` in this directory, then http://localhost:8000/' + widgetFiles[0] + '.'
        : ', as shipped.'));
  }
  L.push('');
  return L.join('\n');
}

// ------------------------------------------------------------------ chat

/**
 * The re-enacted making-of. Reads as a session: prompt in, result out.
 * Kept to ONE idea per message; the reader should be able to skim it in
 * twenty seconds and know exactly what to paste.
 */
function chatFor(g, { agent, steps, finalDest, finalPoster, promptSteps, widgetFiles = [], inlineB64 }) {
  const msgs = [];
  const attached = new Set();   // an image earns its place once, not twice

  // One shape for every result in the transcript:
  //
  //     **The delivered clip · 0:05.1, 1280×720**
  //     `result/step-2.mp4` — open in the editor tab on the right
  //
  // Stills travel as a real attached image (the IDE's own format). Clips never
  // do: pasting a frame grab in as a stand-in for a video is the cheap move,
  // and the file is already open in File editors anyway.
  function resultBlock(dest, poster, label) {
    const kind = kindOf(dest);
    const heading = label || (
      kind === 'video' ? 'The delivered clip' :
      kind === 'audio' ? 'The delivered track' :
      kind === 'image' ? 'The delivered frame' : 'The delivered file');
    const where =
      kind === 'video' ? ' — open in the editor tab on the right' :
      kind === 'audio' ? ' — press play in the editor tab on the right' : '';
    const pic = kind === 'image' ? dest : null;
    const b64 = pic && !attached.has(pic) && inlineB64 ? inlineB64(pic) : null;
    if (b64) attached.add(pic);
    return {
      text: `**${heading}**\n\`${dest}\`${where}`,
      images: b64 ? { [pic]: b64 } : null,
    };
  }

  /** A set returned by one prompt: every frame attached, each one named. */
  function resultSetBlock(dests, label) {
    const lines = [`**${label || 'The delivered set'}**`];
    const images = {};
    for (const d of dests) {
      lines.push(`\`${d.dest}\`${d.label ? ` — ${d.label}` : ''}`);
      if (!attached.has(d.dest) && inlineB64) {
        const b64 = inlineB64(d.dest);
        if (b64) { images[d.dest] = b64; attached.add(d.dest); }
      }
    }
    return { text: lines.join('\n'), images: Object.keys(images).length ? images : null };
  }

  const intro = [];
  let introImages = null;
  intro.push(`This project is the finished guide **${g.title}**.`);
  if (finalDest) {
    // The cover frame is the guide's own key art, so it opens the transcript —
    // and it is the only place a poster appears.
    const cover = kindOf(finalDest) === 'image' ? finalDest : finalPoster;
    const b64 = cover && inlineB64 ? inlineB64(cover) : null;
    if (b64) { introImages = { [cover]: b64 }; attached.add(cover); }
    intro.push('');
    intro.push(`**The finished piece**\n\`${finalDest}\``);
  }
  intro.push('');
  if (promptSteps.length) {
    intro.push(`Below is how it was made — ${promptSteps.length === 1 ? 'the prompt' : `${promptSteps.length} prompts, in order`}, and what came back each time. ` +
      'To make your own version: copy any prompt here, change what should be yours, send it.');
  } else {
    // No prompts means nothing was generated from text — the craft is in the
    // capture and the edit. Saying "here is how it was made" and then handing
    // over no prompt reads like a missing file, so name the reason.
    intro.push('There is no prompt to copy in this one: the piece was made in the capture and the edit, not from a text instruction. ' +
      'What follows is the mechanism, step by step, with the frame or excerpt that proves each claim. All files are in `result/`.');
  }
  msgs.push({ from: 'agent', text: intro.join('\n'), images: introImages });

  for (const s of steps) {
    if (s.prompt) {
      msgs.push({ from: 'user', text: s.prompt });
      // Title first so the transcript reads as a run of named beats, then what
      // the step was actually about, then the result block.
      const reply = [`**${s.title}**`];
      let images = null;
      const body = s.caption || s.text;
      if (body) reply.push(body);
      if (s.dest) { const m = resultBlock(s.dest, s.poster, s.label); reply.push(m.text); images = m.images; }
      else if (s.dests && s.dests.length) { const m = resultSetBlock(s.dests, s.label); reply.push(m.text); images = m.images; }
      msgs.push({ from: 'agent', text: reply.join('\n\n'), images });
    } else if (s.dest || s.text || (s.dests && s.dests.length)) {
      // A step without a prompt is a decision or a delivery note — the agent
      // states it, nothing for the reader to paste.
      const reply = [`**${s.title}**`];
      let images = null;
      if (s.text) reply.push(s.text);
      if (s.dest) { const m = resultBlock(s.dest, s.poster, s.label); reply.push(m.text); images = m.images; }
      else if (s.dests && s.dests.length) { const m = resultSetBlock(s.dests, s.label); reply.push(m.text); images = m.images; }
      msgs.push({ from: 'agent', text: reply.join('\n\n'), images });
    }
  }

  const outro = [];
  // Only point at the final file if the run did not already land on it.
  const lastWithMedia = [...steps].reverse().find(s => s.dest);
  if (finalDest && (!lastWithMedia || lastWithMedia.dest !== finalDest)) {
    outro.push(`The finished piece is \`${finalDest}\`.`);
  }
  if (widgetFiles.length) outro.push(`The interactive build is \`${widgetFiles[0]}\` — open it in a browser (see README if the models don't load from file://).`);
  if (promptSteps.length) {
    // "Keep the camera and lens lines" is nonsense advice on a music prompt.
    // Name the parts that actually carry the craft for this medium.
    const kind = kindOf(finalDest || '');
    const keep =
      kind === 'audio' ? 'the technical lines (instrumentation, tempo, mix notes)' :
      kind === 'video' ? 'the technical lines (camera, lens, lighting, format)' :
      kind === 'image' ? 'the technical lines (framing, lighting, format, style block)' :
      'the technical lines';
    outro.push(`Your turn — paste prompt 1 (\`${promptSteps[0].promptFile}\`) with your own subject and I'll run it. ` +
      `Keep ${keep} and change only what the piece is about.`);
  } else {
    // Without a prompt to paste, the handoff has to be the mechanism itself:
    // the step titles ARE the recipe, so restate them as the offer.
    const recipe = steps.map(s => s.title).filter(Boolean);
    outro.push('Your turn — tell me what you have (your own scans, footage or stills) and I\'ll run the same mechanism on it' +
      (recipe.length ? `: ${recipe.map(t => t.toLowerCase()).join('; then ')}.` : '.'));
  }
  msgs.push({ from: 'agent', text: outro.join('\n\n') });

  return {
    topic: g.title,
    agent,
    user: 'You',
    date: g.date ? `${g.date}T12:00:00` : undefined,
    messages: msgs,
  };
}
