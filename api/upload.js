/**
 * POST /api/upload — media upload gateway for Quadcode Guide.
 *
 * Uses Vercel Blob client-upload flow: the client (publish script / agent)
 * asks this endpoint for a short-lived upload token, then streams the file
 * DIRECTLY to Blob storage — bypassing the 4.5MB serverless body limit.
 * Large videos (100MB+) upload fine.
 *
 * Auth: x-api-key header (same GUIDES_API_KEY as /api/publish),
 *       timing-safe compared. Without a valid key no token is issued.
 *
 * Allowed content: video/*, image/*, audio/* up to 200MB.
 * Files land under guides/ prefix with a random suffix, public access.
 *
 * No secrets in this file — BLOB_READ_WRITE_TOKEN and GUIDES_API_KEY
 * are read from Vercel env vars.
 */

const crypto = require('crypto');
const { handleUpload } = require('@vercel/blob/client');

function timingSafeMatch(given, expected) {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(String(expected || ''));
  if (!expected || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Body is not valid JSON' }); }
  }

  // --- Auth: same key as /api/publish ---
  // Token-generation requests must carry the key in the x-api-key header
  // or in clientPayload (the @vercel/blob client can't send custom headers).
  // "blob.upload-completed" callbacks come from Vercel infra and are
  // signature-verified by handleUpload itself, so no key check for them.
  const isCallback = body && body.type === 'blob.upload-completed';
  if (!isCallback) {
    const givenKey = req.headers['x-api-key'] || (body && body.payload && body.payload.clientPayload);
    if (!timingSafeMatch(givenKey, process.env.GUIDES_API_KEY)) {
      return res.status(401).json({ error: 'Invalid or missing x-api-key' });
    }
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: [
          'video/mp4', 'video/webm', 'video/quicktime',
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'audio/mpeg', 'audio/wav', 'audio/mp4',
        ],
        maximumSizeInBytes: 200 * 1024 * 1024, // 200MB
        addRandomSuffix: true,
        // keep everything under a tidy prefix
        pathname: pathname.startsWith('guides/') ? pathname : `guides/${pathname}`,
        // clientPayload carries the API key for auth — never bake it into the token
        tokenPayload: null,
      }),
      onUploadCompleted: async () => {
        // nothing to do server-side; the publish script wires URLs into guides.json
      },
    });
    return res.status(200).json(jsonResponse);
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Upload handshake failed' });
  }
};
