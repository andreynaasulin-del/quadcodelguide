import { readFileSync } from 'node:fs';
import { upload } from '@vercel/blob/client';

const SITE = 'https://quadcodeguide.vercel.app';
const apiKey = process.env.GUIDES_API_KEY || readFileSync('.temp/secrets/api_key.txt', 'utf8').trim();

try {
  const blob = await upload('guides/promo-gta/_test.png', Buffer.from('hello test ' + Date.now()), {
    access: 'public',
    contentType: 'image/png',
    handleUploadUrl: `${SITE}/api/upload`,
    clientPayload: apiKey,
  });
  console.log('OK ->', blob.url);
} catch (e) {
  console.error('FAILED:', e.name, '-', e.message);
}
