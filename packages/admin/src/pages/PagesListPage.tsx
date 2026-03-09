import { usePages } from '@/api/hooks/usePages';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { FileText, MoreVertical, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

type SortOption = 'name' | 'fields' | 'sections';

export function PagesListPage() {
  const { data: pages, isLoading, error, refetch } = usePages();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('name');

  const filteredPages = pages
    ?.filter(
      (page) =>
        page.name.toLowerCase().includes(search.toLowerCase()) ||
        page.slug.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'fields':
          return b.fieldCount - a.fieldCount;
        case 'sections':
          return b.sectionCount - a.sectionCount;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="p-12">
        <LoadingState message="Loading pages..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12">
        <ErrorState
          title="Failed to load pages"
          message="Could not fetch the list of pages."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="px-12 py-8 space-y-7 max-w-[1320px]">
      {/* Title + Actions */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-5xl font-medium" style={{ letterSpacing: '-1px' }}>
            Content Pages
          </h2>
          <p className="text-[15px] text-[hsl(var(--subtle-foreground))]" style={{ letterSpacing: '0.2px' }}>
            Manage your content pages and fields
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-[260px] pl-9 pr-3 text-[13px] bg-[hsl(var(--secondary))] border-0"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-5 text-[13px] font-medium border-[hsl(var(--border))]"
              >
                Sort by
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSort('name')}>Name</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('fields')}>Field count</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort('sections')}>Section count</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pages grid */}
      {filteredPages && filteredPages.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => (
            <Link key={page.slug} to={`/pages/${page.slug}`}>
              <div className="border border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-7 space-y-5 hover:shadow-lifted transition-all duration-150 cursor-pointer h-full">
                {/* Top row: icon + badge + menu */}
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-lg bg-[hsl(var(--subtle))] border border-[hsl(var(--border))] flex items-center justify-center">
                    <FileText className="h-[18px] w-[18px] text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[hsl(var(--secondary))] text-foreground hover:bg-[hsl(var(--secondary))] border-0 text-xs font-semibold">
                      Published
                    </Badge>
                    <button type="button" className="text-[hsl(var(--muted-foreground))] hover:text-foreground transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <h3 className="font-display text-[26px] font-bold" style={{ letterSpacing: '-0.3px' }}>
                    {page.name}
                  </h3>
                  <p className="text-[13px] text-[hsl(var(--subtle-foreground))]">
                    /{page.slug}
                  </p>
                </div>

                {/* Meta footer */}
                <div className="flex items-center gap-3 pt-4 border-t border-[hsl(var(--secondary))]">
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]" style={{ letterSpacing: '0.5px' }}>
                    {page.fieldCount} fields
                  </span>
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]" style={{ letterSpacing: '0.5px' }}>
                    {page.sectionCount} sections
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : pages && pages.length > 0 ? (
        <div className="border border-[hsl(var(--border))] rounded-md py-12">
          <EmptyState
            icon={Search}
            title="No pages found"
            description={`No pages match "${search}". Try a different search term.`}
            action={{
              label: 'Clear search',
              onClick: () => setSearch(''),
            }}
          />
        </div>
      ) : (
        <div className="border border-[hsl(var(--border))] rounded-md py-12">
          <EmptyState
            icon={FileText}
            title="No pages detected"
            description="Add data-reverso markers to your React components, then run the scanner to detect pages."
          />
        </div>
      )}
    </div>
  );
}
