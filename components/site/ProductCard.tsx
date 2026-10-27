import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatPrice, mediaUrl, primaryImage } from '@/lib/utils';

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const img = primaryImage(product.images);
  const second = product.images.find((i) => i !== img);
  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-paper sm:rounded-2xl">
        {img ? (
          <>
            <Image
              src={mediaUrl(img.url)}
              alt={img.alt || product.name}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
            />
            {second && (
              <Image
                src={mediaUrl(second.url)}
                alt=""
                fill
                sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
                className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="jaal grid h-full place-items-center bg-navy text-sm text-ivory/70">Photo coming soon</div>
        )}
        {product.isFeatured && (
          <span className="absolute top-1.5 left-1.5 rounded-full bg-gold-soft px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-wide text-navy uppercase sm:top-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-[0.7rem] sm:normal-case">
            Top selling
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col pt-2 sm:pt-4">
        <p className="truncate text-[0.6875rem] text-muted sm:text-xs sm:font-medium">{product.category?.name}</p>
        <h3 className="mt-0.5 line-clamp-2 font-sans text-sm leading-snug font-medium text-ink sm:mt-1 sm:font-display sm:text-lg sm:font-normal">
          <Link href={`/product/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className="mt-auto pt-1 text-[0.8125rem] text-ink-soft sm:pt-2 sm:text-sm">
          {product.priceFrom > 0 ? (
            <>
              From <span className="font-semibold text-navy">{formatPrice(product.priceFrom)}</span>{' '}
              <span className="text-muted">{product.unit}</span>
            </>
          ) : (
            <span className="font-semibold text-navy">Price on request</span>
          )}
        </p>
      </div>
    </article>
  );
}
