import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireUser } from '@/server/session';
import { route } from '@/server/http';
import { getPostById } from '@/server/services/blog';

/** Opens a blog on the website. Drafts and scheduled posts are shown via Next.js draft mode (signed-in editors only). */
export const GET = route(async (req) => {
  await requireUser(req);
  const post = await getPostById(req.nextUrl.searchParams.get('id') ?? '');
  const live = post.status === 'published' && post.publishedAt && post.publishedAt <= new Date();
  if (!live) (await draftMode()).enable();
  return NextResponse.redirect(new URL(`/blog/${post.slug}`, req.url));
});
