import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

// Animated stat card component
function StatCard({ title, value, description, icon: Icon, color, bgColor, trend }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold animate-count-up">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div className={`text-xs mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-3 w-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-sm mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function IBMBSection({ data, formatCurrency }) {
  const { overview, status_breakdown, fraud_type_breakdown, region_breakdown, io_performance, tat_stats } = data;

  // Prepare data for IO performance bar chart
  const ioPerformanceData = io_performance.map(io => ({
    name: io.investigator_name.split(' ')[0], // First name only for cleaner display
    fullName: io.investigator_name,
    assigned: io.total_assigned,
    completed: io.completed,
    pending: io.pending,
  }));

  // Prepare data for approval rate chart
  const approvalRateData = io_performance
    .filter(io => io.approval_rate !== null)
    .map(io => ({
      name: io.investigator_name.split(' ')[0],
      fullName: io.investigator_name,
      rate: io.approval_rate,
    }));

  // Custom tooltip for IO performance
  const IOPerformanceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-bold text-sm mb-2">{data.fullName}</p>
          <p className="text-sm text-gray-600">Total Assigned: <span className="font-bold">{data.assigned}</span></p>
          <p className="text-sm text-green-600">Completed: <span className="font-bold">{data.completed}</span></p>
          <p className="text-sm text-orange-600">Pending: <span className="font-bold">{data.pending}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Cases"
          value={overview.total_cases}
          description="All IB/MB disputes"
          icon={FileText}
          color="text-blue-500"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Open"
          value={overview.open}
          description="Awaiting investigation"
          icon={Clock}
          color="text-yellow-500"
          bgColor="bg-yellow-50"
        />
        <StatCard
          title="In Progress"
          value={overview.in_progress}
          description="Under investigation"
          icon={TrendingUp}
          color="text-orange-500"
          bgColor="bg-orange-50"
        />
        <StatCard
          title="Closed"
          value={overview.closed}
          description="Resolved cases"
          icon={CheckCircle}
          color="text-green-500"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Total Disputed"
          value={formatCurrency(overview.total_disputed_amount)}
          description="Across all cases"
          icon={AlertTriangle}
          color="text-red-500"
          bgColor="bg-red-50"
        />
      </div>

      {/* Charts Row 1: Status & Type */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Case Status Donut Chart */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Case Status Distribution</CardTitle>
            <CardDescription>Breakdown of cases by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={status_breakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ status, count }) => count > 0 ? `${status}: ${count}` : ''}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {status_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fraud Type Bar Chart */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Type of Cases</CardTitle>
            <CardDescription>SCAM vs FRAUD categorization</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fraud_type_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#8884d8"
                  animationBegin={0}
                  animationDuration={800}
                  radius={[8, 8, 0, 0]}
                >
                  {fraud_type_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Region Segregation Table & Chart */}
      {region_breakdown.length > 0 && (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Region Segregation</CardTitle>
            <CardDescription>Case distribution across regions with TAT metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-semibold">Region</th>
                      <th className="p-2 text-center font-semibold">Total</th>
                      <th className="p-2 text-center font-semibold">Open</th>
                      <th className="p-2 text-center font-semibold">Closed</th>
                      <th className="p-2 text-center font-semibold">Avg TAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {region_breakdown.map((region, index) => (
                      <tr
                        key={index}
                        className="border-b hover:bg-muted/30 transition-colors animate-slide-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="p-2 font-medium">{region.region}</td>
                        <td className="p-2 text-center">{region.total}</td>
                        <td className="p-2 text-center text-yellow-600">{region.open}</td>
                        <td className="p-2 text-center text-green-600">{region.closed}</td>
                        <td className="p-2 text-center">
                          {region.avg_tat_days ? `${region.avg_tat_days} days` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bar Chart */}
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={region_breakdown.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="region" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="open" fill="#f59e0b" name="Open" stackId="a" animationDuration={800} />
                  <Bar dataKey="closed" fill="#10b981" name="Closed" stackId="a" animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* IO Performance */}
      {io_performance.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* IO Performance - Cases */}
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Investigator Performance</CardTitle>
              <CardDescription>Case assignment and completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ioPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<IOPerformanceTooltip />} />
                  <Bar
                    dataKey="assigned"
                    fill="#3b82f6"
                    name="Total Assigned"
                    animationDuration={800}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Approval Rate */}
          {approvalRateData.length > 0 && (
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Approval Rate by Investigator</CardTitle>
                <CardDescription>Percentage of cases approved vs rejected</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={approvalRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="font-bold text-sm">{payload[0].payload.fullName}</p>
                              <p className="text-sm text-green-600">
                                Approval Rate: <span className="font-bold">{payload[0].value}%</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="rate"
                      fill="#10b981"
                      name="Approval Rate (%)"
                      animationDuration={800}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAT Metrics */}
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Turnaround Time (TAT) Statistics</CardTitle>
          <CardDescription>Average case resolution time metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Average TAT</p>
              <p className="text-2xl font-bold text-blue-700">{tat_stats.avg_tat_days} days</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Minimum TAT</p>
              <p className="text-2xl font-bold text-green-700">{tat_stats.min_tat_days} days</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Maximum TAT</p>
              <p className="text-2xl font-bold text-orange-700">{tat_stats.max_tat_days} days</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Cases Closed</p>
              <p className="text-2xl font-bold text-purple-700">{tat_stats.total_closed}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
