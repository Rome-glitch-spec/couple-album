'use client';

import { createContext, useContext } from 'react';

export const UploadContext = createContext<{ openUpload: () => void }>({ openUpload: () => {} });

export function useUploadModal() {
  return useContext(UploadContext);
}
