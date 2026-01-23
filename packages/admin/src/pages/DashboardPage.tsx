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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your content and media</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pages.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pages.withContent ?? 0} with content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fields.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">Across all pages and sections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.media.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(stats?.media.totalSize ?? 0)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Field Types</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.fields.byType ? Object.keys(stats.fields.byType).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Different types in use</p>
          </CardContent>
        </Card>
      </div>

      {/* Content sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pages list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Content Pages</CardTitle>
                <CardDescription>Pages detected from your components</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/pages">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pages && pages.length > 0 ? (
              <div className="space-y-3">
                {pages.slice(0, 5).map((page) => (
                  <Link
                    key={page.slug}
                    to={`/pages/${page.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium">{page.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {page.sectionCount} sections, {page.fieldCount} fields
                      </p>
                    </div>
                    <Badge variant="secondary">{page.slug}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pages detected yet</p>
                <p className="text-xs">
                  Add <code>data-reverso</code> markers to your components
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest content changes and updates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                        {activity.user && ` by ${activity.user}`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        activity.type === 'content_update'
                          ? 'default'
                          : activity.type === 'media_upload'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs">Activity will appear here as you edit content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/pages">
                <FileText className="mr-2 h-4 w-4" />
                Edit Content
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/media">
                <Image className="mr-2 h-4 w-4" />
                Upload Media
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
