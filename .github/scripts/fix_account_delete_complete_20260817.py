from pathlib import Path

# Strengthen DB/account cleanup for newer user-linked feature tables.
p=Path('server_lib/db.js')
s=p.read_text(encoding='utf-8')
old='''export async function deleteUser(id) {
  await ensureSchema();
  // Pet톡에 올린 이미지(Vercel Blob)는 DB 삭제로 자동 정리되지 않으므로 먼저 지워요.
  // 첨부 이미지 삭제가 실패한 상태에서 계정만 먼저 삭제하면 고아 파일이 남을 수 있으므로,
  // Blob 정리가 성공한 뒤 DB 계정을 삭제합니다. 실패하면 요청 자체를 실패시켜 사용자가 다시 시도할 수 있게 합니다.
  const { deleteAllBlobsForUser } = await import("./community.js");
  await deleteAllBlobsForUser(id);
  // ON DELETE CASCADE 로 pg_user_state(반려동물 정보 등)와 Pet톡 게시글/댓글/좋아요/신고 내역까지 함께 삭제돼요.
  await sql`delete from pg_users where id = ${id}`;
}
'''
new='''export async function deleteUser(id) {
  await ensureSchema();
  // Pet톡에 올린 이미지(Vercel Blob)는 DB 삭제로 자동 정리되지 않으므로 먼저 지워요.
  // Blob 정리가 성공한 뒤 DB 계정을 삭제합니다. 실패하면 요청 자체를 실패시켜 사용자가 다시 시도할 수 있게 합니다.
  const { deleteAllBlobsForUser } = await import("./community.js");
  await deleteAllBlobsForUser(id);

  // PetPoint / Pet사주·Pet타로는 기능 모듈에서 필요할 때 생성되는 독립 테이블이라
  // pg_users 외래키 CASCADE에 의존하지 않고 회원탈퇴 시 명시적으로 삭제합니다.
  // 아직 한 번도 해당 기능을 쓰지 않아 테이블이 없는 경우(42P01)는 정상적으로 건너뜁니다.
  const optionalDelete = async (run) => {
    try { await run(); }
    catch (e) { if (e?.code !== "42P01") throw e; }
  };
  await optionalDelete(() => sql`delete from pg_point_ledger where user_id=${id}`);
  await optionalDelete(() => sql`delete from pg_point_accounts where user_id=${id}`);
  await optionalDelete(() => sql`delete from pg_pet_daily_content where user_id=${id}`);
  await optionalDelete(() => sql`delete from pg_feature_usage where user_id=${id}`);

  // 운영 이력 중 다른 행에 단순 문자열로 남을 수 있는 내부 사용자 ID는 식별 연결을 끊습니다.
  await sql`update pg_admin_audit_logs set target_user_id=null where target_user_id=${id}`;
  await sql`update pg_reports set reviewed_by=null where reviewed_by=${id}`;
  await sql`update pg_community_restrictions set updated_by=null where updated_by=${id}`;
  await sql`update pg_admins set added_by=null where added_by=${id}`;

  // pg_user_state(반려동물·성장·PetBTI 등), Pet톡, 문의, 장소후기,
  // Pet음악 좋아요/댓글 등 pg_users를 참조하는 데이터는 ON DELETE CASCADE/SET NULL로 정리됩니다.
  await sql`delete from pg_users where id = ${id}`;
}
'''
if old not in s:
    raise SystemExit('deleteUser block not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

# Account deletion should not silently leave PetTalk attachment blobs behind.
p=Path('server_lib/community.js')
c=p.read_text(encoding='utf-8')
old2='''  await Promise.all(rows.filter((r) => /^https?:\\/\\//i.test(r.storage_url || "")).map((r) => blobDel(r.storage_url).catch(() => {})));
}'''
# Only replace the last occurrence, which belongs to deleteAllBlobsForUser; ordinary post deletion behavior remains unchanged.
pos=c.rfind(old2)
if pos < 0:
    raise SystemExit('account blob cleanup block not found')
new2='''  const urls = rows.map((r) => r.storage_url).filter((u) => /^https?:\\/\\//i.test(u || ""));
  // 회원탈퇴에서는 Blob 삭제 오류를 숨기지 않습니다. 파일 정리가 실패하면 계정 삭제도 완료 처리하지 않아
  // 사용자가 다시 시도할 수 있고, 개인정보 파일만 고아 상태로 남는 일을 막습니다.
  await Promise.all(urls.map((u) => blobDel(u)));
}'''
c=c[:pos]+c[pos:].replace(old2,new2,1)
p.write_text(c,encoding='utf-8')

print('complete account deletion cleanup applied')
