import React from 'react';
import { User, Zap, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';

function Profile() {
  const { user } = useAuth();
  const { transactions, balance } = useTokens();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Please sign in to view your profile.</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'PHY Balance',
      value: balance,
      icon: Zap,
      color: 'text-primary'
    },
    {
      label: 'Total Earned',
      value: transactions.filter(t => t.type === 'earned').reduce((sum, t) => sum + t.amount, 0),
      icon: TrendingUp,
      color: 'text-green-400'
    },
    {
      label: 'Content Unlocked',
      value: transactions.filter(t => t.type === 'spent').length,
      icon: Trophy,
      color: 'text-secondary'
    },
    {
      label: 'Days Active',
      value: Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24)),
      icon: Calendar,
      color: 'text-blue-400'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="card">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <p className="text-gray-400">{user.email}</p>
            <div className="flex items-center mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.subscriptionStatus === 'premium' 
                  ? 'bg-secondary text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {user.subscriptionStatus === 'premium' ? 'Premium Member' : 'Free Member'}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="token-badge text-lg">
              {balance} PHY
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card text-center">
            <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-gray-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
        
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.slice(0, 10).map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    transaction.type === 'earned' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className={`font-semibold ${
                  transaction.type === 'earned' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {transaction.type === 'earned' ? '+' : '-'}{transaction.amount} PHY
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No transactions yet. Start earning PHY tokens!</p>
        )}
      </div>

      {/* Account Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Earn More Tokens</h3>
          <ul className="space-y-2 text-gray-400">
            <li>• Daily login bonus: 2 PHY</li>
            <li>• Watch content: 1-5 PHY</li>
            <li>• Refer friends: 50 PHY</li>
            <li>• Complete tasks: 10-25 PHY</li>
          </ul>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
          <div className="space-y-3">
            <button className="w-full text-left text-gray-400 hover:text-white transition-colors">
              Change Password
            </button>
            <button className="w-full text-left text-gray-400 hover:text-white transition-colors">
              Update Profile
            </button>
            <button className="w-full text-left text-gray-400 hover:text-white transition-colors">
              Notification Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;