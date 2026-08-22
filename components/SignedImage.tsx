'use client';

import { useEffect, useState } from 'react';
import { getDisplayUrl } from '@/lib/media-service';
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
    if (!path) {
      setFailed(true);
      setSrc(null);
      return;
    }
    setFailed(false);
    setSrc(null);
    getDisplayUrl(path)
      .then((url) => active && setSrc(url))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
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
