import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  DollarSign,
  Users,
  TrendingUp,
  Settings,
  Eye,
  Download
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'streams'>('overview');

  if (!connected) {
    return (
      <section id="dashboard" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card max-w-md mx-auto">
            <div className="mb-6">
              <div className="bg-primary-100 p-4 rounded-full w-fit mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600">
                Connect your Solana wallet to start creating and managing payment streams.
              </p>
            </div>
            <WalletMultiButton className="!bg-primary-600 !rounded-lg !font-semibold !w-full !py-3" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="dashboard" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Dashboard</h2>
          <p className="text-gray-600">
            Manage your payment streams • Connected: {publicKey?.toString().slice(0, 8)}...
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'create', label: 'Create Stream', icon: Plus },
                { id: 'streams', label: 'My Streams', icon: Clock }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'create' && <CreateStreamTab />}
        {activeTab === 'streams' && <StreamsTab />}
      </div>
    </section>
  );
};

const OverviewTab: React.FC = () => {
  const stats = [
    { label: 'Active Streams', value: '3', icon: Clock, color: 'blue' },
    { label: 'Total Streamed', value: '$2,450', icon: ArrowUpRight, color: 'green' },
    { label: 'Total Received', value: '$1,890', icon: ArrowDownLeft, color: 'purple' },
    { label: 'Pending Claims', value: '$125', icon: DollarSign, color: 'orange' }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { type: 'created', amount: '$500', recipient: 'alice.sol', time: '2 hours ago' },
            { type: 'redeemed', amount: '$150', recipient: 'bob.sol', time: '5 hours ago' },
            { type: 'completed', amount: '$300', recipient: 'charlie.sol', time: '1 day ago' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'created' ? 'bg-blue-100' :
                  activity.type === 'redeemed' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {activity.type === 'created' && <Plus className="w-4 h-4 text-blue-600" />}
                  {activity.type === 'redeemed' && <Download className="w-4 h-4 text-green-600" />}
                  {activity.type === 'completed' && <Clock className="w-4 h-4 text-gray-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">{activity.type} stream</p>
                  <p className="text-sm text-gray-600">{activity.recipient}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{activity.amount}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CreateStreamTab: React.FC = () => {
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    ratePerMinute: '',
    duration: '',
    feePercentage: '5'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement stream creation
    console.log('Creating stream:', formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Payment Stream</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter Solana wallet address"
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount (SOL)
              </label>
              <input
                type="number"
                step="0.001"
                className="input-field"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate per Minute (SOL)
              </label>
              <input
                type="number"
                step="0.0001"
                className="input-field"
                placeholder="0.0000"
                value={formData.ratePerMinute}
                onChange={(e) => setFormData({ ...formData, ratePerMinute: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (Minutes)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="60"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fee Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="input-field"
                value={formData.feePercentage}
                onChange={(e) => setFormData({ ...formData, feePercentage: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Stream Preview</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Duration:</span>
                <span className="ml-2 font-medium">{formData.duration || '0'} minutes</span>
              </div>
              <div>
                <span className="text-gray-600">Total Fee:</span>
                <span className="ml-2 font-medium">
                  {formData.amount && formData.feePercentage 
                    ? (parseFloat(formData.amount) * parseFloat(formData.feePercentage) / 100).toFixed(4)
                    : '0'} SOL
                </span>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            Create Stream
          </button>
        </form>
      </div>
    </div>
  );
};

const StreamsTab: React.FC = () => {
  const streams = [
    {
      id: '1',
      recipient: 'alice.sol',
      amount: '1.5 SOL',
      rate: '0.025 SOL/min',
      progress: 65,
      status: 'active',
      timeLeft: '21 minutes'
    },
    {
      id: '2',
      recipient: 'bob.sol',
      amount: '0.8 SOL',
      rate: '0.013 SOL/min',
      progress: 100,
      status: 'completed',
      timeLeft: 'Completed'
    },
    {
      id: '3',
      recipient: 'charlie.sol',
      amount: '2.0 SOL',
      rate: '0.033 SOL/min',
      progress: 30,
      status: 'active',
      timeLeft: '42 minutes'
    }
  ];

  return (
    <div className="space-y-6">
      {streams.map((stream) => (
        <div key={stream.id} className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-900">{stream.recipient}</h4>
              <p className="text-sm text-gray-600">{stream.amount} • {stream.rate}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                stream.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {stream.status}
              </span>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Eye className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{stream.timeLeft}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stream.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>{stream.progress}%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex space-x-3">
            {stream.status === 'active' && (
              <>
                <button className="btn-secondary flex-1 text-sm py-2">
                  Redeem Available
                </button>
                <button className="btn-primary flex-1 text-sm py-2">
                  View Details
                </button>
              </>
            )}
            {stream.status === 'completed' && (
              <button className="btn-secondary w-full text-sm py-2">
                View Details
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};