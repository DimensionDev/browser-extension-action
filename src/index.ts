import { setFailed, getInput } from '@actions/core';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import urlcat from 'urlcat';

const PREFIX = 'https://www.googleapis.com/upload/chromewebstore/v1.1';

async function getAccessToken(
  refresh_token: string,
  client_id: string,
  client_secret: string,
): Promise<string> {
  const response = await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token,
      client_id,
      client_secret,
      grant_type: 'refresh_token',
    }),
  });
  const data = await response.json();
  return data?.access_token;
}

async function uploadArtifact(token: string, id: string, body: Buffer) {
  const response = await fetch(urlcat(PREFIX, '/items/:id', { id }), {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-goog-api-version': '2',
    },
    body,
  });
  const data = await response.json();
  return data?.uploadState;
}

async function publishArtifact(token: string, id: string) {
  const response = await fetch(urlcat(PREFIX, '/items/:id/publish', { id }), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-goog-api-version': '2',
    },
  });
  const data = await response.json();
  return data?.status;
}

async function main() {
  const appId = getInput('app-id');
  const name = getInput('name');
  const token = await getAccessToken(
    getInput('refresh-token'),
    getInput('client-id'),
    getInput('client-secret'),
  );
  await uploadArtifact(token, appId, await fs.readFile(name));
  if (getInput('publish')) {
    await publishArtifact(token, appId);
  }
}

main().catch((error: Error) => setFailed(error.message));
