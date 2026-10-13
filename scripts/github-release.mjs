// Publishes a GitHub Release for a production build with the APK attached.
// Run by the github_release job in .eas/workflows/release-android.yml; safe to re-run, since an
// existing release for the same tag is reused and an asset with the same name is replaced.
//
// Env: GH_RELEASE_TOKEN (EAS secret, fine-grained PAT with Contents: read and write on the repo),
// APK_PATH, APP_VERSION, BUILD_NUMBER, COMMIT_SHA.

import { readFile } from 'node:fs/promises';

const repo = 'BeastInBash/Forge';
const api = `https://api.github.com/repos/${repo}`;

const GH_RELEASE_TOKEN = process.env.GH_RELEASE_TOKEN;
const APK_PATH = process.env.APK_PATH;
const APP_VERSION = process.env.APP_VERSION;
const BUILD_NUMBER = process.env.BUILD_NUMBER;
const COMMIT_SHA = process.env.COMMIT_SHA;

for (const [name, value] of Object.entries({
  GH_RELEASE_TOKEN,
  APK_PATH,
  APP_VERSION,
  BUILD_NUMBER,
  COMMIT_SHA,
})) {
  if (!value) {
    console.error(`Missing ${name}.`);
    process.exit(1);
  }
}

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${GH_RELEASE_TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28',
};

async function github(url, init = {}) {
  const response = await fetch(url, { ...init, headers: { ...headers, ...init.headers } });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${url} → ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

// Not "v…": tags matching v* are reserved for store releases.
const tag = `forge-v${APP_VERSION}-${BUILD_NUMBER}`;
const assetName = `forge-${APP_VERSION}-${BUILD_NUMBER}.apk`;

async function findOrCreateRelease() {
  const existing = await fetch(`${api}/releases/tags/${tag}`, { headers });
  if (existing.ok) return existing.json();

  return github(`${api}/releases`, {
    method: 'POST',
    body: JSON.stringify({
      tag_name: tag,
      target_commitish: COMMIT_SHA,
      name: `Forge ${APP_VERSION} (${BUILD_NUMBER})`,
      body: [
        `Production build ${BUILD_NUMBER} of Forge ${APP_VERSION}, also uploaded to Google Play closed testing.`,
        '',
        `Install on Android: download **${assetName}** below and open it (allow installs from your browser).`,
      ].join('\n'),
      prerelease: true,
      generate_release_notes: true,
    }),
  });
}

const release = await findOrCreateRelease();

const duplicate = release.assets?.find((asset) => asset.name === assetName);
if (duplicate) {
  await github(`${api}/releases/assets/${duplicate.id}`, { method: 'DELETE' });
}

const apk = await readFile(APK_PATH);
const uploadURL = release.upload_url.replace(/\{.*\}$/, `?name=${encodeURIComponent(assetName)}`);
await github(uploadURL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/vnd.android.package-archive',
    'Content-Length': String(apk.byteLength),
  },
  body: apk,
});

console.log(`Published ${assetName} to ${release.html_url}`);
