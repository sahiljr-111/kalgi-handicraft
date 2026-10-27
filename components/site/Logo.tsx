import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Brand artwork, vector-traced from the business card (see public/brand).
 * - mark:     gold disc with navy peacock (works on any background)
 * - knockout: gold disc with the peacock cut out (for navy backgrounds, exactly like the card)
 */
export function LogoMark({ className = 'size-9', knockout = false }: { className?: string; knockout?: boolean }) {
  return (
    <Image
      src={knockout ? '/brand/kalgi-mark-knockout.svg' : '/brand/kalgi-mark.svg'}
      alt=""
      width={40}
      height={40}
      unoptimized
      className={className}
    />
  );
}

/** Full lockup (mark + KALGI HANDICRAFT). `onDark` picks the gold-on-navy version. */
export function Logo({ onDark = false, className, priority = false, href = '/' }: { onDark?: boolean; className?: string; priority?: boolean; href?: string | null }) {
  const img = (
    <Image
      src={onDark ? '/brand/kalgi-logo-on-dark.svg' : '/brand/kalgi-logo-on-light.svg'}
      alt="Kalgi Handicraft"
      width={260}
      height={100}
      unoptimized
      priority={priority}
      className={cn('h-11 w-auto', className)}
    />
  );
  return href ? (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="Kalgi Handicraft, home">
      {img}
    </Link>
  ) : (
    img
  );
}
