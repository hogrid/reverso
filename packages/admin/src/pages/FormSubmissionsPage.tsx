import {
  useDeleteSubmission,
  useForm,
  useFormSubmissions,
  useUpdateSubmissionStatus,
  type FormSubmission,
} from '@/api/hooks/useForms';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Archive,
  ArrowLeft,
  Check,
  Download,
  Eye,
  Inbox,
  Mail,
  MoreHorizontal,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { endpoints } from '@/api/endpoints';

export function FormSubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: form, isLoading: formLoading } = useForm(id || '');
  const {
    data: submissionsResponse,
    isLoading: submissionsLoading,
    error,
    refetch,
  } = useFormSubmissions(id || '');
  const updateStatus = useUpdateSubmissionStatus(id || '');
  const deleteSubmission = useDeleteSubmission(id || '');

  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isLoading = formLoading || submissionsLoading;
  const submissions = submissionsResponse?.data || [];
  const stats = (submissionsResponse as any)?.meta || { total: 0, new: 0, read: 0, spam: 0 };

  const filteredSubmissions =
    statusFilter === 'all'
      ? submissions
      : submissions.filter((s) => s.status === statusFilter);

  const handleStatusChange = async (submissionId: string, status: 'new' | 'read' | 'spam' | 'archived') => {
    try {
      await updateStatus.mutateAsync({ submissionId, status });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      try {
        await deleteSubmission.mutateAsync(submissionId);
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission(null);
        }
      } catch (err) {
        console.error('Failed to delete submission:', err);
      }
    }
  };

  const handleExport = () => {
    window.open(endpoints.forms.exportSubmissions(id || ''), '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500">New</Badge>;
      case 'read':
        return <Badge variant="secondary">Read</Badge>;
      case 'spam':
        return <Badge variant="destructive">Spam</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return null;
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading submissions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load submissions"
          message="Could not fetch the submissions."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/forms/${id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight">
              {form?.name || 'Form'} Submissions
            </h1>
            <p className="text-sm text-muted-foreground">
              {stats.total} total submissions
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={cn('cursor-pointer transition-all duration-150', statusFilter === 'all' && 'ring-2 ring-ring/40')}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-5">
            <span className="text-[13px] font-medium text-muted-foreground">Total</span>
            <p className="text-2xl font-semibold tabular-nums mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card
          className={cn('cursor-pointer transition-all duration-150', statusFilter === 'new' && 'ring-2 ring-ring/40')}
          onClick={() => setStatusFilter('new')}
        >
          <CardContent className="p-5">
            <span className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-blue-500" />
              New
            </span>
            <p className="text-2xl font-semibold tabular-nums text-blue-600 mt-1">{stats.new}</p>
          </CardContent>
        </Card>
        <Card
          className={cn('cursor-pointer transition-all duration-150', statusFilter === 'read' && 'ring-2 ring-ring/40')}
          onClick={() => setStatusFilter('read')}
        >
          <CardContent className="p-5">
            <span className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-green-500" />
              Read
            </span>
            <p className="text-2xl font-semibold tabular-nums mt-1">{stats.read}</p>
          </CardContent>
        </Card>
        <Card
          className={cn('cursor-pointer transition-all duration-150', statusFilter === 'spam' && 'ring-2 ring-ring/40')}
          onClick={() => setStatusFilter('spam')}
        >
          <CardContent className="p-5">
            <span className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
              Spam
            </span>
            <p className="text-2xl font-semibold tabular-nums text-destructive mt-1">{stats.spam}</p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      {filteredSubmissions.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead className="w-[150px]">IP Address</TableHead>
                <TableHead className="w-[180px]">Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => {
                const previewFields = Object.entries(submission.data || {}).slice(0, 3);
                return (
                  <TableRow
                    key={submission.id}
                    className={cn(
                      'cursor-pointer',
                      submission.status === 'new' && 'bg-blue-50/50 dark:bg-blue-950/20'
                    )}
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground truncate max-w-md">
                        {previewFields.map(([key, value]) => (
                          <span key={key} className="mr-2">
                            <strong>{key}:</strong> {formatValue(value)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {submission.ipAddress || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(submission.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubmission(submission);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {submission.status !== 'read' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(submission.id, 'read');
                              }}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                          {submission.status !== 'spam' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(submission.id, 'spam');
                              }}
                            >
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              Mark as Spam
                            </DropdownMenuItem>
                          )}
                          {submission.status !== 'archived' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(submission.id, 'archived');
                              }}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(submission.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Inbox}
              title={statusFilter === 'all' ? 'No submissions yet' : `No ${statusFilter} submissions`}
              description={
                statusFilter === 'all'
                  ? 'Submissions will appear here when users submit the form.'
                  : `No submissions with status "${statusFilter}" found.`
              }
              action={
                statusFilter !== 'all'
                  ? {
                      label: 'View All',
                      onClick: () => setStatusFilter('all'),
                    }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Submission Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Submission Details
              {selectedSubmission && getStatusBadge(selectedSubmission.status)}
            </DialogTitle>
            <DialogDescription>
              Submitted on{' '}
              {selectedSubmission && new Date(selectedSubmission.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6 py-4">
              {/* Submission Data */}
              <div className="space-y-3">
                <h4 className="font-medium">Form Data</h4>
                <div className="border rounded-lg divide-y">
                  {Object.entries(selectedSubmission.data || {}).map(([key, value]) => (
                    <div key={key} className="flex p-3">
                      <span className="font-medium w-1/3 text-muted-foreground">{key}</span>
                      <span className="flex-1 break-words">{formatValue(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <h4 className="font-medium">Metadata</h4>
                <div className="border rounded-lg divide-y text-sm">
                  <div className="flex p-3">
                    <span className="font-medium w-1/3 text-muted-foreground">IP Address</span>
                    <span className="flex-1 font-mono">
                      {selectedSubmission.ipAddress || '-'}
                    </span>
                  </div>
                  <div className="flex p-3">
                    <span className="font-medium w-1/3 text-muted-foreground">User Agent</span>
                    <span className="flex-1 break-words text-xs">
                      {selectedSubmission.userAgent || '-'}
                    </span>
                  </div>
                  <div className="flex p-3">
                    <span className="font-medium w-1/3 text-muted-foreground">Referrer</span>
                    <span className="flex-1 break-words">
                      {selectedSubmission.referrer || '-'}
                    </span>
                  </div>
                  {selectedSubmission.webhookSentAt && (
                    <div className="flex p-3">
                      <span className="font-medium w-1/3 text-muted-foreground">Webhook Sent</span>
                      <span className="flex-1">
                        {new Date(selectedSubmission.webhookSentAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedSubmission.status !== 'read' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange(selectedSubmission.id, 'read')}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark as Read
                  </Button>
                )}
                {selectedSubmission.status !== 'spam' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange(selectedSubmission.id, 'spam')}
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Mark as Spam
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedSubmission.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
