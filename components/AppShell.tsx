'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const mobilePickerRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.dataset.wallpaper = localStorage.getItem('wallpaper') || 'default';
    const savedWallpaperImage = localStorage.getItem('wallpaper-image');
    if (savedWallpaperImage) {
      document.documentElement.style.setProperty('--wallpaper-image', `url(${savedWallpaperImage})`);
    }
  }, []);

  const openUpload = useCallback(() => setUploadOpen(true), []);
  const openMobilePicker = useCallback(() => mobilePickerRef.current?.click(), []);

  return (
    <UploadContext.Provider value={{ openUpload }}>
      <div className="app-wallpaper flex min-h-dvh">
        <Sidebar profile={profile} partner={partner} />
        <div className="flex-1 min-w-0 pb-20 lg:pb-0">{children}</div>
        <MobileNav onAdd={openMobilePicker} />
      </div>

      <input
        ref={mobilePickerRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          e.target.value = '';
          if (files.length) {
            setSelectedFiles(files);
            setUploadOpen(true);
          }
        }}
      />

      {uploadOpen && (
        <UploadModal
          albums={albums}
          collections={collections}
          initialFiles={selectedFiles}
          onClose={() => {
            setSelectedFiles([]);
            setUploadOpen(false);
          }}
          onUploaded={() => {
            setSelectedFiles([]);
            router.refresh();
          }}
        />
      )}
    </UploadContext.Provider>
  );
}
