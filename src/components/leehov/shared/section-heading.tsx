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
    <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-leehov-blue-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl font-extrabold tracking-normal text-leehov-navy-950 sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-7 text-leehov-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
