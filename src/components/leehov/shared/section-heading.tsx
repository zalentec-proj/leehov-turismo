import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: SectionHeadingProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-leehov-blue-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[30px] font-extrabold leading-tight tracking-normal text-leehov-navy-950 sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-[15px] leading-6 text-leehov-muted sm:mt-4 sm:text-base sm:leading-7">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
