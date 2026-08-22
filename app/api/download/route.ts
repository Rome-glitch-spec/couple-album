import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'couple-media';

// Streams a ZIP of the requested media ids. Uses the caller's own session —
// RLS on `media` and the storage bucket means an unauthorized caller simply
// gets nothing back, never someone else's files.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const idsParam = request.nextUrl.searchParams.get('ids');
  const zipName = request.nextUrl.searchParams.get('zipName') || 'memories';
  if (!idsParam) return NextResponse.json({ error: 'No files requested' }, { status: 400 });

  const ids = idsParam.split(',').filter(Boolean);
  if (ids.length === 0) return NextResponse.json({ error: 'No files requested' }, { status: 400 });
  if (ids.length > 200) return NextResponse.json({ error: 'Too many files at once' }, { status: 400 });

  const { data: rows, error } = await supabase.from('media').select('*').in('id', ids);
  if (error || !rows || rows.length === 0) {
    return NextResponse.json({ error: 'Nothing found to download' }, { status: 404 });
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const row of rows) {
    const { data, error: dlError } = await supabase.storage.from(BUCKET).download(row.storage_path);
    if (dlError || !data) continue;

    let name = row.file_name;
    if (usedNames.has(name)) {
      const [base, ext] = splitExt(name);
      name = `${base}-${row.id.slice(0, 6)}${ext}`;
    }
    usedNames.add(name);

    zip.file(name, await data.arrayBuffer());
  }

  const blob = await zip.generateAsync({ type: 'nodebuffer' });

  return new NextResponse(new Uint8Array(blob), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${sanitize(zipName)}.zip"`,
    },
  });
}

function splitExt(name: string): [string, string] {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return [name, ''];
  return [name.slice(0, dot), name.slice(dot)];
}

function sanitize(name: string) {
  return name.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'memories';
}
