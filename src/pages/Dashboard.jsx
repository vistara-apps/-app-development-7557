import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToken } from '../context/TokenContext';
import { useContent } from '../context/ContentContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { 
  TrendingUp, 
  Coins, 
  Crown, 
  Calendar, 
  BarChart3, 
  Star,
  Clock,
  Eye,
  Award
} from 'lucide-react';

const Dashboard = () => {
  const { user, openAuthModal } = useAuth();
  const { transactions, dailyEarnings, getTokenBalance } = useToken();
  const { content } = useContent();
  const { isFeatureEnabled } = useFeatureFlags();

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-dark-800 rounded-lg p-8">
            <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Your Dashboard</h2>
            <p className="text-gray-400 mb-6">
              {isFeatureEnabled('STEALTH_MODE') 
                ? 'Log in to view your watch history, favorites, and account statistics.'
                : 'Log in to view your earnings, transaction history, and account statistics.'
              }
            </p>
            <button
              onClick={() => openAuthModal('login')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = isFeatureEnabled('STEALTH_MODE') ? [
    {
      label: 'Fights Watched',
      value: Math.floor(Math.random() * 50) + 10,
      icon: Eye,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      label: 'Favorite Fighters',
      value: Math.floor(Math.random() * 15) + 3,
      icon: Star,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      label: 'Hours Watched',
      value: Math.floor(Math.random() * 100) + 20,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Days Active',
      value: Math.floor(Math.random() * 30) + 5,
      icon: Calendar,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    }
  ] : [
    {
      label: 'Total Tokens',
      value: getTokenBalance(),
      icon: Coins,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      label: "Today's Earnings",
      value: dailyEarnings,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Content Watched',
      value: Math.floor(Math.random() * 50) + 10,
      icon: Eye,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Days Active',
      value: Math.floor(Math.random() * 30) + 5,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-dark-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            {isFeatureEnabled('STEALTH_MODE') 
              ? 'Track your viewing activity, favorites, and account status'
              : 'Track your earnings, activity, and account status'
            }
          </p>
        </div>

        {/* Account Status */}
        <div className={`rounded-lg p-6 mb-8 ${
          isFeatureEnabled('STEALTH_MODE') 
            ? 'bg-gradient-to-r from-red-900/30 to-orange-900/30'
            : 'bg-gradient-to-r from-primary-900/30 to-purple-900/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                isFeatureEnabled('STEALTH_MODE')
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : 'bg-gradient-to-r from-primary-500 to-purple-500'
              }`}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user.username}</h2>
                <p className="text-gray-400">{user.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {user.subscriptionStatus === 'premium' ? (
                    <>
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <span className="text-yellow-500 text-sm font-medium">Premium Member</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-500 text-sm">Free Member</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {user.subscriptionStatus !== 'premium' && (
              <button
                onClick={() => window.openSubscriptionModal?.()}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Upgrade to Premium
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-dark-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Recent Transactions
            </h3>
            
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'earned' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {transaction.type === 'earned' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <Coins className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{transaction.description}</p>
                        <p className="text-gray-400 text-xs">
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-right ${
                      transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      <p className="font-medium">
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </p>
                      <p className="text-xs text-gray-400">PHY</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Coins className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No transactions yet</p>
                <p className="text-gray-500 text-sm">Start watching content to earn tokens!</p>
              </div>
            )}
          </div>

          {/* Achievement/Progress */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Achievements & Progress
            </h3>

            <div className="space-y-4">
              {/* Daily Goal */}
              <div className="bg-dark-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">Daily Goal</span>
                  <span className="text-primary-500 text-sm">
                    {dailyEarnings}/50 tokens
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((dailyEarnings / 50) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Content Completion */}
              <div className="bg-dark-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">Content Explorer</span>
                  <span className="text-blue-500 text-sm">
                    {Math.floor(Math.random() * 10) + 5}/{content.length} videos
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(((Math.floor(Math.random() * 10) + 5) / content.length) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Streak */}
              <div className="bg-dark-900 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Daily Streak</p>
                    <p className="text-gray-400 text-sm">
                      {Math.floor(Math.random() * 7) + 1} days in a row
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Token Economy Info */}
        <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 rounded-lg p-6 mt-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Coins className="w-5 h-5 mr-2 text-yellow-500" />
            Phyght Token Economics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-500 mb-1">
                {user.subscriptionStatus === 'premium' ? '2x' : '1x'}
              </div>
              <div className="text-gray-300 text-sm">Token Multiplier</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-500 mb-1">5-20</div>
              <div className="text-gray-300 text-sm">Tokens per Video</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-500 mb-1">20</div>
              <div className="text-gray-300 text-sm">Unlock Premium Video</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
