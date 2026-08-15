import { sql } from "@vercel/postgres";
import crypto from "crypto";
import { del as blobDel } from "@vercel/blob";
import { ensureSchema } from "./db.js";

export const CATEGORIES = ["daily", "brag", "question", "health", "info"];

function newId() {
  return crypto.randomUUID();
}

// pg_posts 를 클라이언트에 안전하게 내려줄 형태로 정리해요.
// user_id(작성자 내부 식별자)는 절대 다른 회원에게 노출하지 않고, isOwner 로만 알려줘요.
function shapePost(row, viewerId, images, likedByMe) {
  return {
    id: row.id,
    isOwner: viewerId ? row.user_id === viewerId : false,
    visibility: row.visibility,
    pet: {
      id: row.pet_id,
      name: row.pet_name,
      species: row.pet_species,
      breed: row.pet_breed,
      birthDate: row.pet_birth_date,
      photo: row.pet_photo,
    },
    category: row.category,
    title: row.title,
    content: row.content,
    images: images || [],
    likeCount: row.like_count,
    commentCount: row.comment_count,
    likedByMe: !!likedByMe,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function shapeComment(row, viewerId) {
  return {
    id: row.id,
    postId: row.post_id,
    isOwner: viewerId ? row.user_id === viewerId : false,
    pet: { id: row.pet_id, name: row.pet_name, photo: row.pet_photo },
    content: row.content,
    createdAt: row.created_at,
  };
}

async function imagesForPosts(postIds) {
  if (!postIds.length) return {};
  const { rows } = await sql`
    select * from pg_post_images where post_id = ANY(${postIds}) order by post_id, sort_order asc
  `;
  const map = {};
  rows.forEach((r) => {
    if (!map[r.post_id]) map[r.post_id] = [];
    map[r.post_id].push(r.storage_url);
  });
  return map;
}

async function likedPostIds(viewerId, postIds) {
  if (!viewerId || !postIds.length) return new Set();
  const { rows } = await sql`
    select post_id from pg_likes where user_id = ${viewerId} and post_id = ANY(${postIds})
  `;
  return new Set(rows.map((r) => r.post_id));
}

// ---- 게시글 목록 (카테고리/검색/정렬/페이지네이션) ----
export async function listPosts({ category, sort, search, page, pageSize, viewerId }) {
  await ensureSchema();
  const p = Math.max(1, page || 1);
  const size = Math.min(30, Math.max(1, pageSize || 10));
  const offset = (p - 1) * size;
  const term = search && search.trim() ? `%${search.trim()}%` : null;
  const cat = category && category !== "all" ? category : null;
  const orderClause = sort === "popular" ? sql`order by like_count desc, created_at desc` : sql`order by created_at desc`;

  // limit+1 개를 가져와서 다음 페이지가 더 있는지 판단해요 (COUNT 쿼리 없이 가벼운 무한스크롤 지원)
  // 비공개(private) 게시글은 일반 피드/인기글/검색 그 어디에도 노출되지 않아요 — 작성자 본인이 보더라도 마찬가지예요.
  const { rows } = await sql`
    select * from pg_posts
    where is_hidden = false
      and visibility = 'public'
      and (${cat}::text is null or category = ${cat})
      and (${term}::text is null or title ilike ${term} or content ilike ${term})
    ${orderClause}
    limit ${size + 1} offset ${offset}
  `;
  const hasMore = rows.length > size;
  const pageRows = rows.slice(0, size);
  const ids = pageRows.map((r) => r.id);
  const [imgMap, liked] = await Promise.all([imagesForPosts(ids), likedPostIds(viewerId, ids)]);
  return {
    posts: pageRows.map((r) => shapePost(r, viewerId, imgMap[r.id], liked.has(r.id))),
    hasMore,
    page: p,
  };
}

export async function getPostById(id, viewerId) {
  await ensureSchema();
  const { rows } = await sql`select * from pg_posts where id = ${id} and is_hidden = false`;
  if (!rows[0]) return null;
  // 비공개 글은 작성자 본인만 조회할 수 있어요. 다른 회원에게는 "존재하지 않는 글"과 동일하게 취급해서
  // 비공개 글이 있다는 사실 자체도 노출되지 않도록 해요 (직접 URL 접근·API 조회 모두 차단).
  if (rows[0].visibility === "private" && rows[0].user_id !== viewerId) return null;
  const [imgMap, liked] = await Promise.all([imagesForPosts([id]), likedPostIds(viewerId, [id])]);
  return shapePost(rows[0], viewerId, imgMap[id], liked.has(id));
}

export async function createPost({ userId, pet, category, title, content, imageUrls, visibility }) {
  await ensureSchema();
  if (!CATEGORIES.includes(category)) throw new Error("invalid category");
  if (!pet || !pet.id) throw new Error("pet is required");
  const vis = visibility === "private" ? "private" : "public";
  const id = newId();
  await sql`
    insert into pg_posts (id, user_id, pet_id, pet_name, pet_species, pet_breed, pet_birth_date, pet_photo, category, title, content, visibility)
    values (${id}, ${userId}, ${pet.id}, ${pet.name}, ${pet.species}, ${pet.breed || null}, ${pet.birthDate || null}, ${pet.photo || null},
      ${category}, ${title}, ${content}, ${vis})
  `;
  const urls = (imageUrls || []).slice(0, 5);
  for (let i = 0; i < urls.length; i++) {
    await sql`insert into pg_post_images (id, post_id, storage_url, sort_order) values (${newId()}, ${id}, ${urls[i]}, ${i})`;
  }
  return getPostById(id, userId);
}

export async function updatePost({ id, userId, category, title, content, imageUrls, visibility }) {
  await ensureSchema();
  if (!CATEGORIES.includes(category)) throw new Error("invalid category");
  const vis = visibility === "private" ? "private" : "public";
  const { rows } = await sql`
    update pg_posts set category = ${category}, title = ${title}, content = ${content}, visibility = ${vis}, updated_at = now()
    where id = ${id} and user_id = ${userId}
    returning id
  `;
  if (!rows[0]) return null; // 존재하지 않거나 작성자 본인이 아님 (DB 조건에서부터 차단)

  if (imageUrls) {
    const existing = await sql`select storage_url from pg_post_images where post_id = ${id}`;
    const keep = new Set(imageUrls);
    const toRemove = existing.rows.map((r) => r.storage_url).filter((u) => !keep.has(u));
    await Promise.all(toRemove.map((u) => blobDel(u).catch(() => {})));
    await sql`delete from pg_post_images where post_id = ${id}`;
    const urls = imageUrls.slice(0, 5);
    for (let i = 0; i < urls.length; i++) {
      await sql`insert into pg_post_images (id, post_id, storage_url, sort_order) values (${newId()}, ${id}, ${urls[i]}, ${i})`;
    }
  }
  return getPostById(id, userId);
}

// 작성자 본인 확인은 SQL의 WHERE 절 자체에 포함되어 있어서, 프런트에서 막는 게 아니라 DB 레벨에서 강제돼요.
export async function deletePost({ id, userId }) {
  await ensureSchema();
  const { rows } = await sql`select storage_url from pg_post_images where post_id = ${id}`;
  const { rowCount } = await sql`delete from pg_posts where id = ${id} and user_id = ${userId}`;
  if (rowCount > 0) {
    await Promise.all(rows.map((r) => blobDel(r.storage_url).catch(() => {})));
  }
  return rowCount > 0;
}

export async function toggleLike({ postId, userId }) {
  await ensureSchema();
  const { rows: postRows } = await sql`select user_id, visibility from pg_posts where id = ${postId} and is_hidden = false`;
  if (!postRows[0]) throw new Error("post not found");
  if (postRows[0].visibility === "private" && postRows[0].user_id !== userId) {
    throw new Error("not allowed"); // 비공개 글은 좋아요 대상이 될 수 없어요
  }
  const inserted = await sql`
    insert into pg_likes (user_id, post_id) values (${userId}, ${postId})
    on conflict do nothing
    returning post_id
  `;
  if (inserted.rows.length > 0) {
    await sql`update pg_posts set like_count = like_count + 1 where id = ${postId}`;
    return { liked: true };
  }
  await sql`delete from pg_likes where user_id = ${userId} and post_id = ${postId}`;
  await sql`update pg_posts set like_count = greatest(like_count - 1, 0) where id = ${postId}`;
  return { liked: false };
}

export async function listComments(postId, viewerId) {
  await ensureSchema();
  const { rows: postRows } = await sql`select user_id, visibility from pg_posts where id = ${postId} and is_hidden = false`;
  if (!postRows[0]) return [];
  if (postRows[0].visibility === "private" && postRows[0].user_id !== viewerId) return [];
  const { rows } = await sql`
    select * from pg_comments where post_id = ${postId} and is_hidden = false order by created_at asc
  `;
  return rows.map((r) => shapeComment(r, viewerId));
}

export async function addComment({ postId, userId, pet, content }) {
  await ensureSchema();
  const id = newId();
  const { rows: postRows } = await sql`select id, user_id, visibility from pg_posts where id = ${postId} and is_hidden = false`;
  if (!postRows[0]) throw new Error("post not found");
  if (postRows[0].visibility === "private" && postRows[0].user_id !== userId) {
    throw new Error("not allowed"); // 비공개 글은 댓글 대상이 될 수 없어요
  }
  await sql`
    insert into pg_comments (id, post_id, user_id, pet_id, pet_name, pet_photo, content)
    values (${id}, ${postId}, ${userId}, ${pet?.id || null}, ${pet?.name || "PetGrow"}, ${pet?.photo || null}, ${content})
  `;
  await sql`update pg_posts set comment_count = comment_count + 1 where id = ${postId}`;
  const { rows } = await sql`select * from pg_comments where id = ${id}`;
  return shapeComment(rows[0], userId);
}

export async function deleteComment({ id, userId }) {
  await ensureSchema();
  const { rows } = await sql`
    delete from pg_comments where id = ${id} and user_id = ${userId} returning post_id
  `;
  if (rows[0]) {
    await sql`update pg_posts set comment_count = greatest(comment_count - 1, 0) where id = ${rows[0].post_id}`;
    return true;
  }
  return false;
}

export async function createReport({ reporterUserId, targetType, targetId, reason, detail }) {
  await ensureSchema();
  if (!["post", "comment"].includes(targetType)) throw new Error("invalid target type");
  const id = newId();
  const inserted = await sql`
    insert into pg_reports (id, reporter_user_id, target_type, target_id, reason, detail)
    values (${id}, ${reporterUserId}, ${targetType}, ${targetId}, ${reason}, ${detail || null})
    on conflict (reporter_user_id, target_type, target_id) do nothing
    returning id
  `;
  return { reported: inserted.rows.length > 0, alreadyReported: inserted.rows.length === 0 };
}

export async function getMyPosts(userId, page, pageSize, visibilityFilter) {
  await ensureSchema();
  const p = Math.max(1, page || 1);
  const size = Math.min(30, Math.max(1, pageSize || 10));
  const vf = visibilityFilter === "public" || visibilityFilter === "private" ? visibilityFilter : null;
  const { rows } = await sql`
    select * from pg_posts where user_id = ${userId}
      and (${vf}::text is null or visibility = ${vf})
    order by created_at desc limit ${size + 1} offset ${(p - 1) * size}
  `;
  const hasMore = rows.length > size;
  const pageRows = rows.slice(0, size);
  const ids = pageRows.map((r) => r.id);
  const imgMap = await imagesForPosts(ids);
  return { posts: pageRows.map((r) => shapePost(r, userId, imgMap[r.id], false)), hasMore };
}

export async function getMyComments(userId, page, pageSize) {
  await ensureSchema();
  const p = Math.max(1, page || 1);
  const size = Math.min(30, Math.max(1, pageSize || 10));
  const { rows } = await sql`
    select c.*, p.title as post_title from pg_comments c
    join pg_posts p on p.id = c.post_id
    where c.user_id = ${userId}
    order by c.created_at desc limit ${size + 1} offset ${(p - 1) * size}
  `;
  const hasMore = rows.length > size;
  const pageRows = rows.slice(0, size);
  return {
    comments: pageRows.map((r) => ({ ...shapeComment(r, userId), postTitle: r.post_title })),
    hasMore,
  };
}

export async function getMyLikedPosts(userId, page, pageSize) {
  await ensureSchema();
  const p = Math.max(1, page || 1);
  const size = Math.min(30, Math.max(1, pageSize || 10));
  const { rows } = await sql`
    select p.* from pg_likes l join pg_posts p on p.id = l.post_id
    where l.user_id = ${userId} and p.is_hidden = false
    order by l.created_at desc limit ${size + 1} offset ${(p - 1) * size}
  `;
  const hasMore = rows.length > size;
  const pageRows = rows.slice(0, size);
  const ids = pageRows.map((r) => r.id);
  const imgMap = await imagesForPosts(ids);
  return { posts: pageRows.map((r) => shapePost(r, userId, imgMap[r.id], true)), hasMore };
}

// 회원탈퇴 시 이 회원이 올린 게시글의 이미지 파일(Blob)을 먼저 정리해요.
// DB 행 자체는 pg_users 삭제 시 ON DELETE CASCADE 로 posts/comments/likes/reports 까지 함께 삭제돼요.
export async function deleteAllBlobsForUser(userId) {
  await ensureSchema();
  const { rows } = await sql`
    select i.storage_url from pg_post_images i
    join pg_posts p on p.id = i.post_id
    where p.user_id = ${userId}
  `;
  await Promise.all(rows.map((r) => blobDel(r.storage_url).catch(() => {})));
}
