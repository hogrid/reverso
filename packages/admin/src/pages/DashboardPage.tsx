import { usePages } from '@/api/hooks/usePages';
import { useStats } from '@/api/hooks/useStats';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFileSize } from '@/lib/utils';
import { ArrowRight, Clock, FileText, Image, Layers, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useStats();
  const { data: pages, isLoading: pagesLoading } = usePages();

  if (statsLoading || pagesLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading dashboard..." />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load dashboard"
          message="Could not fetch dashboard statistics."
          onRetry={() => refetchStats()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your content and media</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium text-muted-foreground">Total Pages</span>
              <FileText className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="text-2xl font-semibold tabular-nums">{stats?.pages.total ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.pages.withContent ?? 0} with content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium text-muted-foreground">Total Fields</span>
              <Layers className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="text-2xl font-semibold tabular-nums">{stats?.fields.total ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all pages</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium text-muted-foreground">Media Files</span>
              <Image className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="text-2xl font-semibold tabular-nums">{stats?.media.total ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatFileSize(stats?.media.totalSize ?? 0)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium text-muted-foreground">Field Types</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="text-2xl font-semibold tabular-nums">
              {stats?.fields.byType ? Object.keys(stats.fields.byType).length : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Different types in use</p>
          </CardContent>
        </Card>
      </div>

      {/* Content sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pages list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Content Pages</CardTitle>
                <CardDescription>Pages detected from your components</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                <Link to="/pages">
                  View all
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pages && pages.length > 0 ? (
              <div className="space-y-1">
                {pages.slice(0, 5).map((page) => (
                  <Link
                    key={page.slug}
                    to={`/pages/${page.slug}`}
                    className="flex items-center justify-between px-3 py-2.5 -mx-1 rounded-md hover:bg-accent transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{page.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {page.sectionCount} sections, {page.fieldCount} fields
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2 shrink-0 font-mono text-[11px]">
                      {page.slug}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No pages detected yet</p>
                <p className="text-xs mt-1">
                  Add <code className="px-1 py-0.5 rounded bg-accent text-xs">data-reverso</code> markers to your components
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest content changes and updates</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-1">
                {stats.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 px-3 py-2.5 -mx-1 rounded-md">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(activity.timestamp).toLocaleString()}
                        {activity.user && ` by ${activity.user}`}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[11px]"
                    >
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs mt-1">Activity will appear here as you edit content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Quick Actions</p>
              <p className="text-xs text-muted-foreground mt-0.5">Common tasks and shortcuts</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/pages">
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Edit Content
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/media">
                  <Image className="mr-1.5 h-3.5 w-3.5" />
                  Upload Media
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
