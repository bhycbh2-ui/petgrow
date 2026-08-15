import { put } from "@vercel/blob";
import { getSessionUserId } from "../_lib/session.js";

const ALLOWED_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 8 * 1024 * 1024; // 8MB — 클라이언트에서 이미 리사이즈/압축한 이미지가 오는 걸 전제로 넉넉하게 잡은 상한선

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const uid = getSessionUserId(req);
  if (!uid) { res.status(401).json({ error: "unauthenticated" }); return; }

  const { dataUrl } = req.body || {};
  if (!dataUrl || typeof dataUrl !== "string") { res.status(400).json({ error: "dataUrl is required" }); return; }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) { res.status(400).json({ error: "invalid data url" }); return; }
  const mime = match[1];
  const ext = ALLOWED_MIME[mime];
  if (!ext) { res.status(400).json({ error: "only jpg/png/webp images are allowed" }); return; }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) { res.status(413).json({ error: "image is too large" }); return; }

  try {
    const filename = `community/${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: mime,
    });
    res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "upload failed" });
  }
}
