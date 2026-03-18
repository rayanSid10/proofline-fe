import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { getDashboardStats } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Section components
import IBMBSection from './sections/IBMBSectionEnhanced';
import FTDHSection from './sections/FTDHSectionEnhanced';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function EnhancedDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await getDashboardStats();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => fetchDashboardData()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Fraud Investigation Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive overview of fraud cases and dispute management
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* IBMB Section */}
      <div className="space-y-6">
        <div className="border-l-4 border-blue-500 pl-4">
          <h2 className="text-2xl font-bold text-blue-900">IB/MB Disputes</h2>
          <p className="text-sm text-muted-foreground">
            Internet & Mobile Banking fraud investigation cases
          </p>
        </div>
        <IBMBSection data={dashboardData.ibmb} formatCurrency={formatCurrency} />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 py-2 text-sm font-semibold text-gray-500 rounded-full border-2 border-gray-300">
            FTDH MODULE
          </span>
        </div>
      </div>

      {/* FTDH Section */}
      <div className="space-y-6">
        <div className="border-l-4 border-purple-500 pl-4">
          <h2 className="text-2xl font-bold text-purple-900">
            Fraud Transaction Dispute Handling
          </h2>
          <p className="text-sm text-muted-foreground">
            1LINK interbank fraud dispute management
          </p>
        </div>
        <FTDHSection data={dashboardData.ftdh} formatCurrency={formatCurrency} />
      </div>

      {/* Footer timestamp */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t">
        Last updated: {new Date(dashboardData.generated_at).toLocaleString('en-PK')}
      </div>
    </div>
  );
}

export default EnhancedDashboardPage;
