import { usePages } from '@/api/hooks/usePages';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, ChevronRight, FileText, Layers, Search } from 'lucide-react';
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
      <div className="p-6">
        <LoadingState message="Loading pages..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load pages"
          message="Could not fetch the list of pages."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Content Pages</h1>
        <p className="text-sm text-muted-foreground">Manage content across all detected pages</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input
            type="search"
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-[13px]"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-muted-foreground">
              <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
              Sort by {sort}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSort('name')}>Name</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSort('fields')}>Field count</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSort('sections')}>Section count</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Pages grid */}
      {filteredPages && filteredPages.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => (
            <Link key={page.slug} to={`/pages/${page.slug}`}>
              <Card className="hover:shadow-lifted hover:border-border transition-all duration-150 cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-accent p-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle>{page.name}</CardTitle>
                        <CardDescription className="font-mono text-[11px] mt-0.5">
                          /{page.slug}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 mt-1" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      <span>{page.sectionCount} sections</span>
                    </div>
                    <Badge variant="outline" className="text-[11px]">{page.fieldCount} fields</Badge>
                  </div>
                  {page.updatedAt && (
                    <p className="mt-2 text-xs text-muted-foreground/70">
                      Updated {new Date(page.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : pages && pages.length > 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Search}
              title="No pages found"
              description={`No pages match "${search}". Try a different search term.`}
              action={{
                label: 'Clear search',
                onClick: () => setSearch(''),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={FileText}
              title="No pages detected"
              description="Add data-reverso markers to your React components, then run the scanner to detect pages."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
