import React from 'react';
import { UserRound } from 'lucide-react';
import { resolveAuthorName, NEWSROOM_BYLINE } from '../../lib/editorial';

/**
 * Article byline.
 *
 * The author is the real `ci_admin` account that created the row: `db.ts`
 * joins `ci_blog.user_created_by` to `ci_admin.admin_id` and composes
 * `firstname lastname` (see `mapBlogRow`). When an article predates that link
 * — legacy rows with no matching admin — it falls back to the newsroom itself,
 * never to an invented person: attributing a story to a journalist who does not
 * exist is exactly the kind of thing E-E-A-T assessment penalises.
 *
 * Marked up with schema.org `author`/`Person` so the attribution is machine
 * readable alongside the article's existing JSON-LD.
 */
export interface AuthorBylineProps {
  authorName?: string | null;
  /** Rendered to the right of the name (date, reading time, …). */
  children?: React.ReactNode;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'N';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AuthorByline: React.FC<AuthorBylineProps> = ({
  authorName,
  children,
  className = '',
}) => {
  // A generic system account ("Admin User") resolves to null and is shown as
  // the newsroom byline rather than being printed as if it were a journalist.
  const resolved = resolveAuthorName(authorName);
  const name = resolved || NEWSROOM_BYLINE;
  const isNewsroom = resolved === null;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-stone-600 font-mono py-3 border-y border-[#E7E5E4] ${className}`}
    >
      <div className="flex items-center gap-2.5" itemProp="author" itemScope itemType="https://schema.org/Person">
        <div
          aria-hidden="true"
          className="w-7 h-7 rounded-full bg-[#991B1B] flex items-center justify-center font-bold text-white text-[11px] shrink-0"
        >
          {isNewsroom ? <UserRound className="w-3.5 h-3.5" /> : initials(name)}
        </div>
        <span className="flex flex-col leading-tight">
          <span className="text-[9px] uppercase tracking-widest text-stone-500">
            {isNewsroom ? 'Reported by' : 'Written by'}
          </span>
          <span className="text-stone-800 font-bold uppercase tracking-wider" itemProp="name">
            {name}
          </span>
        </span>
      </div>
      {children}
    </div>
  );
};

export default AuthorByline;
