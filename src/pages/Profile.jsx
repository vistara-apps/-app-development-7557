import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToken } from '../context/TokenContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Crown, 
  Coins, 
  Settings, 
  Edit,
  Save,
  X
} from 'lucide-react';

const Profile = () => {
  const { user, openAuthModal, updateSubscription } = useAuth();
  const { getTokenBalance, transactions } = useToken();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    preferences: user?.preferences || []
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-dark-800 rounded-lg p-8">
            <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Your Profile</h2>
            <p className="text-gray-400 mb-6">
              Log in to view and manage your profile information.
            </p>
            <button
              onClick={() => openAuthModal('login')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = () => {
    // In a real app, this would make an API call
    console.log('Saving profile:', editForm);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      username: user.username,
      email: user.email,
      preferences: user.preferences
    });
    setIsEditing(false);
  };

  const totalEarned = transactions
    .filter(t => t.type === 'earned')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = Math.abs(transactions
    .filter(t => t.type === 'spent')
    .reduce((sum, t) => sum + t.amount, 0));

  return (
    <div className="min-h-screen bg-dark-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-dark-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Account Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-primary-500 hover:text-primary-400 flex items-center space-x-1"
                >
                  {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </button>
              </div>

              {/* Profile Picture */}
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{user.username}</h3>
                  <p className="text-gray-400">Member since {new Date(user.joinDate).toLocaleDateString()}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {user.subscriptionStatus === 'premium' ? (
                      <>
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-500 text-sm font-medium">Premium Member</span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-500 text-sm">Free Member</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Username
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                      className="w-full px-3 py-2 bg-dark-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 text-white">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{user.username}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full px-3 py-2 bg-dark-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 text-white">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{user.email}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Join Date
                  </label>
                  <div className="flex items-center space-x-2 text-white">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(user.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={handleSaveProfile}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="border border-gray-600 hover:border-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Subscription Management */}
            <div className="bg-dark-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Subscription Management
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Current Plan</p>
                    <p className="text-gray-400 text-sm">
                      {user.subscriptionStatus === 'premium' ? 'Premium Membership' : 'Free Tier'}
                    </p>
                  </div>
                  <div className="text-right">
                    {user.subscriptionStatus === 'premium' ? (
                      <div className="text-yellow-500 font-medium">$10/month</div>
                    ) : (
                      <div className="text-green-500 font-medium">Free</div>
                    )}
                  </div>
                </div>

                {user.subscriptionStatus !== 'premium' ? (
                  <button
                    onClick={() => window.openSubscriptionModal?.()}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200"
                  >
                    Upgrade to Premium
                  </button>
                ) : (
                  <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Crown className="w-5 h-5 text-yellow-500 mr-2" />
                      <span className="text-yellow-500 font-medium">Premium Active</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      You're enjoying all premium benefits including 2x token earnings!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Token Overview */}
            <div className="bg-dark-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Coins className="w-5 h-5 mr-2 text-yellow-500" />
                Token Overview
              </h3>

              <div className="space-y-4">
                <div className="text-center p-4 bg-dark-900 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-500 mb-1">
                    {getTokenBalance()}
                  </div>
                  <div className="text-sm text-gray-300">Current Balance</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-500">{totalEarned}</div>
                    <div className="text-xs text-gray-400">Total Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-500">{totalSpent}</div>
                    <div className="text-xs text-gray-400">Total Spent</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-dark-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full text-left text-gray-300 hover:text-white p-2 hover:bg-dark-900 rounded-lg transition-colors">
                  View Transaction History
                </button>
                
                <button className="w-full text-left text-gray-300 hover:text-white p-2 hover:bg-dark-900 rounded-lg transition-colors">
                  Download Data
                </button>
                
                <button className="w-full text-left text-gray-300 hover:text-white p-2 hover:bg-dark-900 rounded-lg transition-colors">
                  Privacy Settings
                </button>
                
                <button className="w-full text-left text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;