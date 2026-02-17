import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  ArrowRight,
  ClipboardCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataMasker } from '@/components/shared/DataMasker';
import { mockCases } from '@/data/mockCases';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Calculate stats from mock data
const openCases = mockCases.filter((c) => c.status === 'open').length;
const inProgressCases = mockCases.filter((c) => c.status === 'in_progress').length;
const pendingReviewCases = mockCases.filter((c) => c.status === 'pending_review').length;
const closedCases = mockCases.filter((c) => ['closed', 'approved'].includes(c.status)).length;
const totalAmount = mockCases.reduce((sum, c) => sum + c.total_disputed_amount, 0);

const stats = [
  {
    title: 'Total Cases',
    value: mockCases.length.toString(),
    description: 'All IB/MB disputes',
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Open',
    value: openCases.toString(),
    description: 'Awaiting investigation',
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  {
    title: 'In Progress',
    value: inProgressCases.toString(),
    description: 'Under investigation',
    icon: TrendingUp,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    title: 'Pending Review',
    value: pendingReviewCases.toString(),
    description: 'Awaiting supervisor',
    icon: ClipboardCheck,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Closed',
    value: closedCases.toString(),
    description: 'Resolved cases',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Total Disputed',
    value: formatCurrency(totalAmount),
    description: 'Across all cases',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    isLarge: true,
  },
];

// Get recent cases (last 5)
const recentCases = [...mockCases]
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  .slice(0, 5);

// Get pending review cases
const pendingReviewList = mockCases.filter((c) => c.status === 'pending_review');

export function DashboardPage({ currentRole = 'investigator' }) {
  const isSupervisor = currentRole === 'supervisor' || currentRole === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of fraud investigation activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/cases/create">Create Case</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.title} className={stat.isLarge ? 'xl:col-span-1' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`font-bold ${stat.isLarge ? 'text-lg' : 'text-2xl'}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Cases</CardTitle>
              <CardDescription>Latest IB/MB fraud disputes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/cases">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell>
                        <Link
                          to={`/cases/${caseItem.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {caseItem.reference_number}
                        </Link>
                      </TableCell>
                      <TableCell>{caseItem.customer.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={caseItem.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(caseItem.total_disputed_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pending Review - Supervisor View */}
        {isSupervisor ? (
          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-purple-600" />
                  Pending Your Review
                </CardTitle>
                <CardDescription>Cases awaiting supervisor approval</CardDescription>
              </div>
              {pendingReviewList.length > 0 && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {pendingReviewList.length} pending
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {pendingReviewList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No cases pending review</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReviewList.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div>
                        <Link
                          to={`/cases/${caseItem.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {caseItem.reference_number}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {caseItem.customer.name} &bull; {caseItem.assigned_to?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(caseItem.total_disputed_amount)}
                        </p>
                        <Button size="sm" variant="outline" asChild className="mt-1">
                          <Link to={`/cases/${caseItem.id}/review`}>Review</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* My Assignments - Investigator View */
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  My Assignments
                </CardTitle>
                <CardDescription>Cases assigned to you</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockCases
                  .filter((c) => ['open', 'in_progress'].includes(c.status))
                  .slice(0, 4)
                  .map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div>
                        <Link
                          to={`/cases/${caseItem.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {caseItem.reference_number}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {caseItem.customer.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={caseItem.status} />
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(caseItem.created_at), 'dd MMM')}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/cases">View All Cases</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/cases/create">
                <FileText className="h-6 w-6 mb-2" />
                Create New Case
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/cases/import">
                <TrendingUp className="h-6 w-6 mb-2" />
                Import Cases
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/cases?status=pending_review">
                <ClipboardCheck className="h-6 w-6 mb-2" />
                Pending Reviews
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/ftdh">
                <Clock className="h-6 w-6 mb-2" />
                FTDH Inbox
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
