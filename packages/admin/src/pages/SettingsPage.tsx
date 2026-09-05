import { useStats } from '@/api/hooks/useStats';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Account and instance information, plus sign out. Kept deliberately small:
 * everything that changes how the CMS behaves lives in reverso.config.ts and
 * environment variables, not in a settings screen.
 */
export function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { data: stats } = useStats();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="px-12 py-8 max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>The account you are signed in with.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{user?.name || '—'}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user?.email}</dd>
            <dt className="text-muted-foreground">Role</dt>
            <dd>
              <Badge variant="outline">{user?.role ?? 'unknown'}</Badge>
            </dd>
          </dl>
          <Button variant="outline" onClick={handleLogout} data-testid="sign-out">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This instance</CardTitle>
          <CardDescription>
            Fields, pages and media detected from your code. Configuration lives in{' '}
            <code>reverso.config.ts</code> and environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Pages</dt>
            <dd>{stats?.pages.total ?? '—'}</dd>
            <dt className="text-muted-foreground">Fields</dt>
            <dd>{stats?.fields.total ?? '—'}</dd>
            <dt className="text-muted-foreground">Media files</dt>
            <dd>{stats?.media?.total ?? '—'}</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
