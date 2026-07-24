import { readFileSync } from 'node:fs';

const GH_REPO = 'andreynaasulin-del/quadcodelguide';
const BRANCH = 'main';
const ghToken = process.env.GH_TOKEN || readFileSync('.temp/secrets/gh_token.txt', 'utf8').trim();

async function uploadFileToGitHub(localPath, repoPath) {
  const content = readFileSync(localPath).toString('base64');
  let sha;
  try {
    const checkRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${repoPath}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github+json', 'User-Agent': 'quadcode-publisher' },
    });
    if (checkRes.ok) sha = (await checkRes.json()).sha;
  } catch (e) {}

  console.log(`Uploading ${localPath} -> ${repoPath}...`);
  const putRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${repoPath}`, {
    method: 'PUT',
    headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'quadcode-publisher' },
    body: JSON.stringify({ message: `Add SNAP/01 steps 6-8 asset ${repoPath}`, content, sha, branch: BRANCH }),
  });
  const json = await putRes.json();
  if (!putRes.ok) {
    console.error(`Upload failed for ${repoPath}:`, json);
    return false;
  }
  console.log(`OK: ${repoPath} (commit ${json.commit?.sha})`);
  return true;
}

const assets = [
  { local: '.temp/images_from_tools/0724_123431825_brw_ss.png', repo: 'ui_views/assets/snap01-06-configurator-widget.png' },
  { local: '.temp/images_from_tools/0724_123555777_brw_ss.png', repo: 'ui_views/assets/snap01-08-bom-panel.png' },
  { local: 'ui_views/assets/snap01-configurator.html', repo: 'ui_views/assets/snap01-configurator.html' },
  { local: 'ui_views/guides.json', repo: 'ui_views/guides.json' },
];

async function main() {
  for (const a of assets) await uploadFileToGitHub(a.local, a.repo);
  console.log('Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
