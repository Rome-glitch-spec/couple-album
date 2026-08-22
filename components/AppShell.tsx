'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import UploadModal from './UploadModal';
import { UploadContext } from '@/lib/upload-context';
import type { Album, Collection, Profile } from '@/types/database';

export default function AppShell({
  profile,
  partner,
  albums,
  collections,
  children,
}: {
  profile: Profile | null;
  partner: Profile | null;
  albums: Album[];
  collections: Collection[];
  children: React.ReactNode;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const router = useRouter();

  const openUpload = useCallback(() => setUploadOpen(true), []);

  return (
    <UploadContext.Provider value={{ openUpload }}>
      <div className="flex min-h-dvh bg-paper">
        <Sidebar profile={profile} partner={partner} />
        <div className="flex-1 min-w-0 pb-20 lg:pb-0">{children}</div>
        <MobileNav onAdd={openUpload} />
      </div>

      {uploadOpen && (
        <UploadModal
          albums={albums}
          collections={collections}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => router.refresh()}
        />
      )}
    </UploadContext.Provider>
  );
}
