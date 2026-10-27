import { cn } from '@/lib/utils';

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'left',
  className,
  as: Tag = 'h2',
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={cn(align === 'center' && 'mx-auto text-center', 'max-w-2xl wide:max-w-3xl', className)}>
      {eyebrow && <p className="eyebrow mb-2 sm:mb-3">{eyebrow}</p>}
      <Tag className={cn('text-ink', Tag === 'h1' ? 'text-[2rem] leading-tight sm:text-4xl lg:text-5xl wide:text-[3.5rem]' : 'text-[1.65rem] leading-tight sm:text-3xl lg:text-4xl wide:text-[2.75rem]')}>{title}</Tag>
      {intro && <p className="mt-3 text-base leading-relaxed text-muted sm:mt-4 sm:text-lg">{intro}</p>}
    </div>
  );
}
