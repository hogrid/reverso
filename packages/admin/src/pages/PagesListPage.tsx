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

  // Filter and sort pages
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Pages</h1>
          <p className="text-muted-foreground">Manage content across all detected pages</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="mr-2 h-4 w-4" />
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => (
            <Link key={page.slug} to={`/pages/${page.slug}`}>
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{page.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">
                          /{page.slug}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      <span>{page.sectionCount} sections</span>
                    </div>
                    <Badge variant="secondary">{page.fieldCount} fields</Badge>
                  </div>
                  {page.updatedAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
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
