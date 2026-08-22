import { NextRequest } from 'next/server';
import heicConvert from 'heic-convert';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');
  if (!path || !/\.(heic|heif)$/i.test(path)) {
    return new Response('Invalid media path.', { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized.', { status: 401 });

  const { data, error } = await supabase.storage.from('couple-media').createSignedUrl(path, 300);
  if (error || !data) return new Response('Could not load this file.', { status: 404 });

  const source = await fetch(data.signedUrl);
  if (!source.ok) return new Response('Could not load this file.', { status: 404 });

  const jpeg = await heicConvert({
    buffer: Buffer.from(await source.arrayBuffer()),
    format: 'JPEG',
    quality: 0.92,
  });

  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
