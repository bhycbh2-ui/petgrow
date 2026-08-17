import fs from 'fs';
import crypto from 'crypto';

const required = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const b64url = (input) => Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), serviceAccount.private_key);
  const assertion = `${unsigned}.${b64url(signature)}`;
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`OAuth failed: ${res.status} ${JSON.stringify(json)}`);
  return json.access_token;
}

async function api(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.body && !(options.body instanceof Buffer) ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${url} failed: ${res.status} ${text}`);
  return data;
}

const packageName = process.env.PLAY_PACKAGE_NAME || 'kr.co.petgrow.app';
const track = required('PLAY_TRACK');
const aabPath = required('AAB_PATH');
const releaseName = process.env.PLAY_RELEASE_NAME || `PetGrow ${new Date().toISOString().slice(0, 10)}`;
const releaseNotes = process.env.PLAY_RELEASE_NOTES || 'PetGrow 기능 및 사용성 개선';
const serviceAccount = JSON.parse(required('PLAY_SERVICE_ACCOUNT_JSON'));
const token = await getAccessToken(serviceAccount);

const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}`;
const edit = await api(`${base}/edits`, token, { method: 'POST', body: '{}' });
const editId = edit.id;

const aab = fs.readFileSync(aabPath);
const uploadUrl = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/edits/${encodeURIComponent(editId)}/bundles?uploadType=media`;
const bundle = await api(uploadUrl, token, {
  method: 'POST',
  body: aab,
  headers: { 'content-type': 'application/octet-stream' },
});

await api(`${base}/edits/${encodeURIComponent(editId)}/tracks/${encodeURIComponent(track)}`, token, {
  method: 'PUT',
  body: JSON.stringify({
    track,
    releases: [{
      name: releaseName,
      versionCodes: [String(bundle.versionCode)],
      status: 'draft',
      releaseNotes: [{ language: 'ko-KR', text: releaseNotes.slice(0, 500) }],
    }],
  }),
});

await api(`${base}/edits/${encodeURIComponent(editId)}:commit`, token, { method: 'POST', body: '{}' });
console.log(`Uploaded versionCode ${bundle.versionCode} to Play track '${track}' as draft.`);
