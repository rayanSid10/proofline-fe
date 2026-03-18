import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, Award, PieChart as PieChartIcon, BarChart3, Map, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatLargeNumber, formatCurrencyAbbreviated, formatCurrencyFull, formatNumberWithCommas } from '@/utils/numberFormat';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
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

// Sophisticated color palette
const COLORS = {
  primary: '#6366f1',      // Indigo
  success: '#10b981',      // Emerald
  warning: '#f59e0b',      // Amber
  danger: '#ef4444',       // Red
  info: '#3b82f6',         // Blue
  purple: '#8b5cf6',       // Purple
  teal: '#14b8a6',         // Teal
  rose: '#f43f5e',         // Rose
  slate: '#64748b',        // Slate
  // Gradients
  gradientStart: '#6366f1',
  gradientEnd: '#8b5cf6',
};

// Animated stat card component
function StatCard({ title, value, description, icon: Icon, gradient, trend, fullValue }) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
        <div className={`p-3 rounded-xl ${gradient} bg-opacity-10`}>
          <Icon className="h-5 w-5 text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' }} />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-count-up cursor-help"
          title={fullValue ? `Full value: ${fullValue}` : undefined}
        >
          {value}
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
        {trend && (
          <div className={`text-xs mt-2 flex items-center gap-1 ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            <TrendingUp className={`h-3 w-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Custom tooltip with gradient
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border-0 rounded-xl shadow-2xl backdrop-blur-sm">
        <p className="font-bold text-sm mb-2 text-gray-800">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function IBMBSectionEnhanced({ data, formatCurrency }) {
  const { overview, status_breakdown, fraud_type_breakdown, region_breakdown, io_performance, tat_stats } = data;

  // Prepare data for IO performance with radar chart
  const ioPerformanceData = io_performance.map(io => ({
    name: io.investigator_name.split(' ')[0],
    fullName: io.investigator_name,
    assigned: io.total_assigned,
    completed: io.completed,
    pending: io.pending,
    efficiency: io.completed > 0 ? Math.round((io.completed / io.total_assigned) * 100) : 0,
  }));

  // Prepare approval rate data
  const approvalRateData = io_performance
    .filter(io => io.approval_rate !== null)
    .map(io => ({
      name: io.investigator_name.split(' ')[0],
      fullName: io.investigator_name,
      rate: io.approval_rate,
    }));

  // Custom gradient definitions
  const gradients = (
    <defs>
      <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
      </linearGradient>
      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
      </linearGradient>
      <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
      </linearGradient>
    </defs>
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards with Gradients */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total Cases"
          value={overview.total_cases}
          description="All IB/MB disputes"
          icon={FileText}
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard
          title="Open"
          value={overview.open}
          description="Awaiting investigation"
          icon={Clock}
          gradient="bg-gradient-to-r from-amber-500 to-orange-500"
        />
        <StatCard
          title="In Progress"
          value={overview.in_progress}
          description="Under investigation"
          icon={TrendingUp}
          gradient="bg-gradient-to-r from-purple-500 to-pink-500"
        />
        <StatCard
          title="Closed"
          value={overview.closed}
          description="Resolved cases"
          icon={CheckCircle}
          gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Total Disputed"
          value={formatCurrencyAbbreviated(overview.total_disputed_amount)}
          fullValue={formatCurrencyFull(overview.total_disputed_amount)}
          description="Across all cases"
          icon={AlertTriangle}
          gradient="bg-gradient-to-r from-rose-500 to-red-500"
        />
      </div>

      {/* Charts Row 1: Status Donut & Type Area Chart */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Case Status Donut Chart with Gradient */}
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-indigo-600" />
              Case Status Distribution
            </CardTitle>
            <CardDescription>Current status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <defs>
                  {status_breakdown.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`statusGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={0.9}/>
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.6}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={status_breakdown.filter(s => s.count > 0)}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  label={({ status, count }) => `${status}: ${count}`}
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {status_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#statusGradient${index})`} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fraud Type with Composed Chart */}
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-rose-600" />
              Type of Cases
            </CardTitle>
            <CardDescription>SCAM vs FRAUD categorization</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={fraud_type_breakdown}>
                {gradients}
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="type" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  animationBegin={0}
                  animationDuration={1000}
                  radius={[12, 12, 0, 0]}
                >
                  {fraud_type_breakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Region Segregation with Area Chart */}
      {region_breakdown.length > 0 && (
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <Map className="h-5 w-5 text-teal-600" />
              Region Segregation
            </CardTitle>
            <CardDescription>Geographic distribution with performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={region_breakdown.slice(0, 8)}>
                {gradients}
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="region" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="open"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="url(#colorPending)"
                  name="Open"
                  animationDuration={1000}
                />
                <Area
                  type="monotone"
                  dataKey="closed"
                  stackId="1"
                  stroke="#10b981"
                  fill="url(#colorCompleted)"
                  name="Closed"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* IO Performance - Composed Chart */}
      {io_performance.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Investigator Performance
              </CardTitle>
              <CardDescription>Case load and completion status</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={ioPerformanceData}>
                  {gradients}
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[8, 8, 0, 0]} />
                  <Area
                    type="monotone"
                    dataKey="assigned"
                    fill="url(#colorAssigned)"
                    stroke="#6366f1"
                    name="Total Assigned"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fraud Amount Distribution Donut Chart */}
          <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                Fraud Amount Distribution
              </CardTitle>
              <CardDescription>Total disputed amounts by fraud category</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <defs>
                    <linearGradient id="scamAmountGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="fraudAmountGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <Pie
                    data={fraud_type_breakdown.filter(f => f.amount > 0)}
                    dataKey="amount"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    label={({ type, amount }) => `${type}: ${formatCurrencyAbbreviated(amount)}`}
                    animationBegin={0}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    {fraud_type_breakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.type === 'SCAM' ? 'url(#scamAmountGradient)' : 'url(#fraudAmountGradient)'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-4 border-0 rounded-xl shadow-2xl backdrop-blur-sm">
                            <p className="font-bold text-sm mb-2 text-gray-800">{payload[0].name}</p>
                            <p className="text-sm flex items-center gap-2" style={{ color: payload[0].payload.color }}>
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }}></span>
                              Amount: <span className="font-bold">{formatCurrencyFull(payload[0].value)}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {payload[0].payload.count} cases
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAT Metrics with Gradient Cards */}
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Turnaround Time (TAT) Analysis
          </CardTitle>
          <CardDescription>Case resolution efficiency metrics</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-shadow">
              <p className="text-sm text-gray-600 font-medium">Average TAT</p>
              <p className="text-3xl font-bold text-indigo-700 mt-2">{tat_stats.avg_tat_days}</p>
              <p className="text-xs text-gray-500 mt-1">days</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-100 p-6 rounded-xl border border-emerald-200 hover:shadow-lg transition-shadow">
              <p className="text-sm text-gray-600 font-medium">Best TAT</p>
              <p className="text-3xl font-bold text-emerald-700 mt-2">{tat_stats.min_tat_days}</p>
              <p className="text-xs text-gray-500 mt-1">days</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-6 rounded-xl border border-orange-200 hover:shadow-lg transition-shadow">
              <p className="text-sm text-gray-600 font-medium">Longest TAT</p>
              <p className="text-3xl font-bold text-orange-700 mt-2">{tat_stats.max_tat_days}</p>
              <p className="text-xs text-gray-500 mt-1">days</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-xl border border-purple-200 hover:shadow-lg transition-shadow">
              <p className="text-sm text-gray-600 font-medium">Cases Analyzed</p>
              <p className="text-3xl font-bold text-purple-700 mt-2">{tat_stats.total_closed}</p>
              <p className="text-xs text-gray-500 mt-1">closed cases</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
