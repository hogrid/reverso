import { usePages } from '@/api/hooks/usePages';
import { useStats } from '@/api/hooks/useStats';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Badge } from '@/components/ui/badge';
import { formatFileSize } from '@/lib/utils';
import { ArrowRight, Clock, FileText, TrendingDown, TrendingUp } from 'lucide-react';
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
      <div className="p-12">
        <LoadingState message="Loading dashboard..." />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="p-12">
        <ErrorState
          title="Failed to load dashboard"
          message="Could not fetch dashboard statistics."
          onRetry={() => refetchStats()}
        />
      </div>
    );
  }

  const statItems = [
    {
      label: 'TOTAL PAGES',
      value: stats?.pages.total ?? 0,
      change: '+12%',
      positive: true,
    },
    {
      label: 'TOTAL FIELDS',
      value: stats?.fields.total ?? 0,
      change: '+8%',
      positive: true,
    },
    {
      label: 'MEDIA FILES',
      value: stats?.media.total ?? 0,
      change: '+24%',
      positive: true,
    },
    {
      label: 'FIELD TYPES',
      value: stats?.fields.byType ? Object.keys(stats.fields.byType).length : 0,
      change: '-2%',
      positive: false,
    },
  ];

  return (
    <div className="px-12 py-9 space-y-8 max-w-[1320px]">
      {/* Welcome */}
      <div className="space-y-1.5">
        <h2 className="font-display text-4xl font-medium" style={{ letterSpacing: '-1.5px' }}>
          Welcome back
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Here's an overview of your content
        </p>
      </div>

      {/* Stats Row */}
      <div className="flex rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--subtle))] overflow-hidden">
        {statItems.map((stat, i) => (
          <div key={stat.label} className="flex flex-1">
            <div className="flex-1 px-6 py-8 space-y-2">
              <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] tracking-[1.5px]">
                {stat.label}
              </p>
              <p className="font-display text-[56px] font-medium leading-none" style={{ letterSpacing: '-2px' }}>
                {stat.value}
              </p>
              <div className="flex items-center gap-1.5">
                {stat.positive ? (
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" aria-hidden="true" />
                )}
                <span className={`text-xs font-medium ${!stat.positive ? 'text-[hsl(var(--destructive))]' : ''}`}>
                  {stat.change}
                </span>
              </div>
            </div>
            {i < statItems.length - 1 && (
              <div className="w-px bg-[hsl(var(--border))] self-stretch" />
            )}
          </div>
        ))}
      </div>

      {/* Bottom sections */}
      <div className="flex gap-8">
        {/* Recent Pages */}
        <div className="flex-1 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Recent Pages</h3>
            <Link
              to="/pages"
              className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-foreground transition-colors flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-md border border-[hsl(var(--border))] overflow-hidden">
            {pages && pages.length > 0 ? (
              pages.slice(0, 4).map((page, i) => (
                <Link
                  key={page.slug}
                  to={`/pages/${page.slug}`}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--subtle))] transition-colors ${
                    i < Math.min(pages.length, 4) - 1 ? 'border-b border-[hsl(var(--border))]' : ''
                  }`}
                >
                  <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
                  <span className="text-[13px] font-medium flex-1">{page.name}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {page.fieldCount} fields
                  </span>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                <FileText className="h-6 w-6 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No pages detected yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="flex-1 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Recent Activity</h3>
          </div>
          <div className="rounded-md border border-[hsl(var(--border))] overflow-hidden">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.slice(0, 4).map((activity, i) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 px-4 py-3 ${
                    i < Math.min(stats.recentActivity.length, 4) - 1
                      ? 'border-b border-[hsl(var(--border))]'
                      : ''
                  }`}
                >
                  <Clock className="h-4 w-4 mt-0.5 text-[hsl(var(--muted-foreground))] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium">{activity.description}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[11px]">
                    {activity.type.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                <Clock className="h-6 w-6 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
