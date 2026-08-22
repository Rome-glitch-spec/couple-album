'use client';

import { useEffect, useState } from 'react';
import heic2any from 'heic2any';
import { getSignedUrl } from '@/lib/media-service';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

export default function SignedImage({
  path,
  alt,
  className,
  imgClassName,
}: {
  path: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let convertedUrl: string | null = null;
    if (!path) {
      setFailed(true);
      setSrc(null);
      return;
    }
    setFailed(false);
    setSrc(null);
    getSignedUrl(path)
      .then(async (url) => {
        if (!/\.(heic|heif)(?:$|\?)/i.test(path)) return url;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Could not load this file.');
        const converted = await heic2any({ blob: await response.blob(), toType: 'image/jpeg', quality: 0.92 });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        convertedUrl = URL.createObjectURL(blob);
        return convertedUrl;
      })
      .then((url) => active && setSrc(url))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    };
  }, [path]);

  if (failed) {
    return (
      <div className={cn('flex items-center justify-center bg-line/40 text-ink-soft', className)}>
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  if (!src) {
    return <div className={cn('animate-pulse bg-line/50', className)} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cn(className, imgClassName)} loading="lazy" />;
}
