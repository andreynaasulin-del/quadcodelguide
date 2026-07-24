import { readFileSync } from 'node:fs';

const GH_REPO = 'andreynaasulin-del/quadcodelguide';
const BRANCH = 'main';
const ghToken = process.env.GH_TOKEN || readFileSync('.temp/secrets/gh_token.txt', 'utf8').trim();

async function uploadFileToGitHub(localPath, repoPath) {
  const content = readFileSync(localPath).toString('base64');
  let sha;
  const checkRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${repoPath}?ref=${BRANCH}`, {
    headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github+json', 'User-Agent': 'quadcode-publisher' },
  });
  if (checkRes.ok) sha = (await checkRes.json()).sha;

  const putRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${repoPath}`, {
    method: 'PUT',
    headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'quadcode-publisher' },
    body: JSON.stringify({ message: `Add SNAP/01 island.glb (retry)`, content, sha, branch: BRANCH }),
  });
  const json = await putRes.json();
  if (!putRes.ok) {
    console.error(`Upload failed:`, json);
    process.exit(1);
  }
  console.log(`OK: ${repoPath} (commit ${json.commit?.sha})`);
}

uploadFileToGitHub('snap01/05-island.glb', 'ui_views/assets/snap01-05-island.glb');
