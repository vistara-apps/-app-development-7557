/**
 * Storage Analytics Component for Admin Dashboard
 * Displays storage usage, costs, and performance metrics
 */

import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Cloud, 
  Database,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const StorageAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedProvider, setSelectedProvider] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedProvider]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, fetch from API
      const mockData = {
        overview: {
          totalStorage: 5368709120, // 5GB
          totalVideos: 150,
          totalCosts: 45.67,
          avgFileSize: 35791394, // ~34MB
          growthRate: 12.5,
        },
        providers: {
          aws: {
            storage: 3221225472, // 3GB
            videos: 90,
            costs: 28.45,
            bandwidth: 1073741824, // 1GB
            requests: 15420,
          },
          supabase: {
            storage: 2147483648, // 2GB
            videos: 60,
            costs: 17.22,
            bandwidth: 536870912, // 512MB
            requests: 8930,
          },
        },
        trends: {
          storage: [
            { date: '2024-01-01', aws: 2.8, supabase: 2.1 },
            { date: '2024-01-02', aws: 2.9, supabase: 2.0 },
            { date: '2024-01-03', aws: 3.0, supabase: 2.0 },
            { date: '2024-01-04', aws: 3.1, supabase: 2.0 },
            { date: '2024-01-05', aws: 3.2, supabase: 2.0 },
          ],
          costs: [
            { date: '2024-01-01', aws: 25.20, supabase: 15.80 },
            { date: '2024-01-02', aws: 26.10, supabase: 16.20 },
            { date: '2024-01-03', aws: 27.30, supabase: 16.50 },
            { date: '2024-01-04', aws: 28.10, supabase: 16.90 },
            { date: '2024-01-05', aws: 28.45, supabase: 17.22 },
          ],
        },
        performance: {
          uploadSpeed: {
            aws: 15.2, // MB/s
            supabase: 8.7,
          },
          downloadSpeed: {
            aws: 45.8,
            supabase: 12.3,
          },
          availability: {
            aws: 99.99,
            supabase: 99.95,
          },
        },
      };

      setAnalytics(mockData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">Failed to load storage analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Storage Analytics</h2>
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-dark-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="bg-dark-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
          >
            <option value="all">All Providers</option>
            <option value="aws">AWS S3</option>
            <option value="supabase">Supabase</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Storage</p>
              <p className="text-2xl font-bold text-white">{formatBytes(analytics.overview.totalStorage)}</p>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500 text-sm">+{analytics.overview.growthRate}%</span>
              </div>
            </div>
            <HardDrive className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Videos</p>
              <p className="text-2xl font-bold text-white">{analytics.overview.totalVideos.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500 text-sm">+8.2%</span>
              </div>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Monthly Costs</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(analytics.overview.totalCosts)}</p>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-red-500 text-sm">+5.1%</span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg File Size</p>
              <p className="text-2xl font-bold text-white">{formatBytes(analytics.overview.avgFileSize)}</p>
              <div className="flex items-center mt-2">
                <ArrowDownRight className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500 text-sm">-2.3%</span>
              </div>
            </div>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Provider Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Storage by Provider</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Cloud className="w-5 h-5 text-orange-500" />
                <span className="text-gray-300">AWS S3</span>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{formatBytes(analytics.providers.aws.storage)}</p>
                <p className="text-gray-400 text-sm">{analytics.providers.aws.videos} videos</p>
              </div>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full" 
                style={{ width: `${(analytics.providers.aws.storage / analytics.overview.totalStorage) * 100}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-green-500" />
                <span className="text-gray-300">Supabase</span>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{formatBytes(analytics.providers.supabase.storage)}</p>
                <p className="text-gray-400 text-sm">{analytics.providers.supabase.videos} videos</p>
              </div>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(analytics.providers.supabase.storage / analytics.overview.totalStorage) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Cost Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Cloud className="w-5 h-5 text-orange-500" />
                <span className="text-gray-300">AWS S3</span>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{formatCurrency(analytics.providers.aws.costs)}</p>
                <p className="text-gray-400 text-sm">62% of total</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-green-500" />
                <span className="text-gray-300">Supabase</span>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{formatCurrency(analytics.providers.supabase.costs)}</p>
                <p className="text-gray-400 text-sm">38% of total</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-medium">Total Monthly</span>
                <span className="text-white font-bold text-lg">{formatCurrency(analytics.overview.totalCosts)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-gray-300 font-medium mb-3">Upload Speed (MB/s)</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">AWS S3</span>
                <span className="text-white font-medium">{analytics.performance.uploadSpeed.aws}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Supabase</span>
                <span className="text-white font-medium">{analytics.performance.uploadSpeed.supabase}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-gray-300 font-medium mb-3">Download Speed (MB/s)</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">AWS S3</span>
                <span className="text-white font-medium">{analytics.performance.downloadSpeed.aws}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Supabase</span>
                <span className="text-white font-medium">{analytics.performance.downloadSpeed.supabase}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-gray-300 font-medium mb-3">Availability (%)</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">AWS S3</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{analytics.performance.availability.aws}%</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Supabase</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{analytics.performance.availability.supabase}%</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors">
            <Zap className="w-5 h-5 text-blue-500" />
            <span className="text-white">Optimize Storage</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-white">View Trends</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-white">Schedule Cleanup</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorageAnalytics;
