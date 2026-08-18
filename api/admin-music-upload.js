import { handleUpload } from "@vercel/blob/client";
import { ensureSchema } from "../server_lib/db.js";
import { getSessionUserId } from "../server_lib/session.js";
import { getAdminRole, verifyToken, roleCan } from "../server_lib/admin.js";

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const MAX_COVER_BYTES = 4 * 1024 * 1024;
const AUDIO_TYPES = ["audio/mpeg","audio/mp3","audio/wav","audio/x-wav","audio/mp4","audio/aac","audio/m4a","audio/x-m4a"];
const COVER_TYPES = ["image/jpeg","image/png","image/webp"];

async function assertMusicAdmin(req, token) {
  const uid = getSessionUserId(req);
  if (!uid) throw Object.assign(new Error("로그인이 필요해요."), { status: 401 });
  const role = await getAdminRole(uid);
  if (!role) throw Object.assign(new Error("관리자 계정이 아니에요."), { status: 403 });
  if (!verifyToken(token, uid)) throw Object.assign(new Error("관리자 인증 시간이 만료됐어요. 관리자센터에서 PIN을 다시 입력해 주세요."), { status: 403, code: "ADMIN_TOKEN_EXPIRED" });
  if (!roleCan(role, "music")) throw Object.assign(new Error("Pet음악 관리 권한이 없어요."), { status: 403 });
  return { uid, role };
}

function parsePayload(raw) {
  try { return JSON.parse(String(raw || "{}")); }
  catch { return {}; }
}

export default async function handler(req, res) {
  await ensureSchema();
  try {
    if (req.method === "GET") {
      await assertMusicAdmin(req, req.headers["x-petgrow-admin-token"] || "");
      return res.status(200).json({
        ok: true,
        blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
        clientUpload: true,
        maxAudioBytes: MAX_AUDIO_BYTES,
        maxCoverBytes: MAX_COVER_BYTES
      });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "지원하지 않는 요청이에요." });
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(503).json({
        error: "Vercel Blob 저장소가 연결되지 않았어요. Vercel 프로젝트의 Storage에서 Public Blob을 연결한 뒤 다시 배포해 주세요.",
        code: "BLOB_NOT_CONFIGURED"
      });
    }

    const json = await handleUpload({
      body: req.body || {},
      request: req,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parsePayload(clientPayload);
        const admin = await assertMusicAdmin(req, payload.adminToken || "");
        const kind = payload.kind === "cover" ? "cover" : "audio";
        const path = String(pathname || "");
        const expectedPrefix = kind === "cover" ? "petmusic/covers/admin/" : "petmusic/admin/";
        if (!path.startsWith(expectedPrefix)) throw Object.assign(new Error("허용되지 않은 업로드 경로예요."), { status: 400 });
        return {
          allowedContentTypes: kind === "cover" ? COVER_TYPES : AUDIO_TYPES,
          maximumSizeInBytes: kind === "cover" ? MAX_COVER_BYTES : MAX_AUDIO_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ uid: admin.uid, kind })
        };
      },
      onUploadCompleted: async () => {}
    });

    return res.status(200).json(json);
  } catch (error) {
    const status = Number(error?.status) || 400;
    const message = error?.message || "음원 업로드를 시작하지 못했어요.";
    console.error("admin-music-upload", error);
    return res.status(status).json({ error: message, code: error?.code || "MUSIC_UPLOAD_FAILED" });
  }
}
