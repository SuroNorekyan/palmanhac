import Link from "next/link";
import clsx from "clsx";

export const ADMIN_PAGE_SIZE = 20;

type AdminPaginationProps = {
  page: number;
  totalItems: number;
  basePath: string;
  searchParams?: Record<string, string | string[] | undefined>;
};

export function AdminPagination({
  page,
  totalItems,
  basePath,
  searchParams = {},
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / ADMIN_PAGE_SIZE));
  if (totalPages <= 1) {
    return null;
  }

  const createHref = (target: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key === "page") {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry) params.append(key, entry);
        });
      } else if (value) {
        params.set(key, value);
      }
    });
    params.set("page", target.toString());
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-neutral-200 pt-4 text-sm text-neutral-700">
      <PaginationLink href={createHref(Math.max(1, page - 1))} disabled={prevDisabled}>
        Previous
      </PaginationLink>
      <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500">
        Page {page} of {totalPages}
      </span>
      <PaginationLink
        href={createHref(Math.min(totalPages, page + 1))}
        disabled={nextDisabled}
      >
        Next
      </PaginationLink>
    </div>
  );
}

type PaginationLinkProps = {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
};

function PaginationLink({ href, disabled, children }: PaginationLinkProps) {
  if (disabled) {
    return (
      <span className="rounded-full bg-neutral-100 px-4 py-2 font-semibold text-neutral-400">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={clsx(
        "rounded-full px-4 py-2 font-semibold text-neutral-700 transition",
        "bg-white shadow-sm hover:bg-neutral-900 hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}
