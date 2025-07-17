import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
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
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useProgram } from '../hooks/useProgram';
import { useStreams } from '../hooks/useStreams';
import { StreamService } from '../services/streamService';
import { 
  calculateStreamProgress, 
  calculateRedeemableAmount, 
  getStreamStatus, 
  formatTokenAmount, 
  parseTokenAmount, 
  getTimeRemaining 
} from '../utils/streamUtils';

export const Dashboard: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { program } = useProgram();
  const { streams, loading: streamsLoading, refetch } = useStreams();
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
        {activeTab === 'overview' && <OverviewTab streams={streams} loading={streamsLoading} />}
        {activeTab === 'create' && <CreateStreamTab program={program} onSuccess={refetch} />}
        {activeTab === 'streams' && <StreamsTab streams={streams} loading={streamsLoading} program={program} onUpdate={refetch} />}
      </div>
    </section>
  );
};

interface OverviewTabProps {
  streams: any[];
  loading: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ streams, loading }) => {
  const { publicKey } = useWallet();

  const stats = React.useMemo(() => {
    if (!publicKey || loading) {
      return [
        { label: 'Active Streams', value: '0', icon: Clock, color: 'blue' },
        { label: 'Total Streamed', value: '0', icon: ArrowUpRight, color: 'green' },
        { label: 'Total Received', value: '0', icon: ArrowDownLeft, color: 'purple' },
        { label: 'Pending Claims', value: '0', icon: DollarSign, color: 'orange' }
      ];
    }

    const activeStreams = streams.filter(s => getStreamStatus(s.account) === 'active').length;
    const totalStreamed = streams
      .filter(s => s.account.payer.equals(publicKey))
      .reduce((sum, s) => sum + parseFloat(formatTokenAmount(s.account.amount)), 0);
    const totalReceived = streams
      .filter(s => s.account.payee.equals(publicKey))
      .reduce((sum, s) => sum + parseFloat(formatTokenAmount(s.account.redeemed)), 0);
    const pendingClaims = streams
      .filter(s => s.account.payee.equals(publicKey))
      .reduce((sum, s) => sum + parseFloat(formatTokenAmount(calculateRedeemableAmount(s.account))), 0);

    return [
      { label: 'Active Streams', value: activeStreams.toString(), icon: Clock, color: 'blue' },
      { label: 'Total Streamed', value: totalStreamed.toFixed(2), icon: ArrowUpRight, color: 'green' },
      { label: 'Total Received', value: totalReceived.toFixed(2), icon: ArrowDownLeft, color: 'purple' },
      { label: 'Pending Claims', value: pendingClaims.toFixed(4), icon: DollarSign, color: 'orange' }
    ];
  }, [streams, publicKey, loading]);

  return (
    <div className="space-y-8">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Loading streams...</span>
        </div>
      )}

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
        {streams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No streams found. Create your first stream to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {streams.slice(0, 5).map((stream, index) => {
              const status = getStreamStatus(stream.account);
              const isPayee = publicKey?.equals(stream.account.payee);
              
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      status === 'active' ? 'bg-blue-100' :
                      status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {status === 'active' && <Clock className="w-4 h-4 text-blue-600" />}
                      {status === 'completed' && <Download className="w-4 h-4 text-green-600" />}
                      {status === 'expired' && <AlertCircle className="w-4 h-4 text-gray-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {isPayee ? 'Receiving from' : 'Streaming to'} 
                      </p>
                      <p className="text-sm text-gray-600">
                        {isPayee 
                          ? `${stream.account.payer.toString().slice(0, 8)}...`
                          : `${stream.account.payee.toString().slice(0, 8)}...`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatTokenAmount(stream.account.amount)} SOL
                    </p>
                    <p className="text-sm text-gray-500">{status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface CreateStreamTabProps {
  program: any;
  onSuccess: () => void;
}

const CreateStreamTab: React.FC<CreateStreamTabProps> = ({ program, onSuccess }) => {
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    ratePerMinute: '',
    duration: '',
    feePercentage: '5'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!program) {
      setError('Program not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payee = new PublicKey(formData.recipient);
      const amount = parseTokenAmount(formData.amount);
      const ratePerMinute = parseTokenAmount(formData.ratePerMinute);
      const durationMinutes = new BN(formData.duration);
      const feePercentage = parseInt(formData.feePercentage);

      // For demo purposes, we'll use a mock mint address
      // In production, you'd select the actual token mint
      const mockMint = new PublicKey('So11111111111111111111111111111111111111112'); // Wrapped SOL

      const streamService = new StreamService(program);
      const result = await streamService.createStream(payee, mockMint, {
        amount,
        ratePerMinute,
        durationMinutes,
        feePercentage
      });

      console.log('Stream created:', result);
      
      // Reset form
      setFormData({
        recipient: '',
        amount: '',
        ratePerMinute: '',
        duration: '',
        feePercentage: '5'
      });
      
      onSuccess();
    } catch (err: any) {
      console.error('Error creating stream:', err);
      setError(err.message || 'Failed to create stream');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Payment Stream</h3>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

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
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Stream...
              </>
            ) : (
              'Create Stream'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

interface StreamsTabProps {
  streams: any[];
  loading: boolean;
  program: any;
  onUpdate: () => void;
}

const StreamsTab: React.FC<StreamsTabProps> = ({ streams, loading, program, onUpdate }) => {
  const { publicKey } = useWallet();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleRedeem = async (stream: any) => {
    if (!program || !publicKey) return;

    setActionLoading(stream.publicKey.toString());
    try {
      const streamService = new StreamService(program);
      // Note: You'll need to get the actual escrow token and fee account addresses
      // This is a simplified version
      const mockMint = new PublicKey('So11111111111111111111111111111111111111112');
      const mockEscrowToken = new PublicKey('11111111111111111111111111111111'); // Replace with actual
      const mockFeeAccount = new PublicKey('11111111111111111111111111111111'); // Replace with actual
      
      await streamService.redeemStream(
        stream.publicKey,
        stream.account.payer,
        stream.account.payee,
        mockMint,
        mockEscrowToken,
        mockFeeAccount
      );
      
      onUpdate();
    } catch (err) {
      console.error('Error redeeming stream:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading streams...</span>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No streams found</h3>
        <p className="text-gray-600 mb-6">Create your first payment stream to get started.</p>
        <button 
          onClick={() => window.location.hash = '#create'}
          className="btn-primary"
        >
          Create Stream
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {streams.map((stream) => (
        <div key={stream.publicKey.toString()} className="card">
          {(() => {
            const progress = calculateStreamProgress(stream.account);
            const status = getStreamStatus(stream.account);
            const timeLeft = getTimeRemaining(stream.account);
            const redeemableAmount = calculateRedeemableAmount(stream.account);
            const isPayee = publicKey?.equals(stream.account.payee);
            const isPayer = publicKey?.equals(stream.account.payer);
            
            return (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {isPayee ? 'Receiving from' : 'Streaming to'}: {' '}
                      {isPayee 
                        ? `${stream.account.payer.toString().slice(0, 8)}...`
                        : `${stream.account.payee.toString().slice(0, 8)}...`
                      }
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatTokenAmount(stream.account.amount)} SOL • {formatTokenAmount(stream.account.ratePerMinute)} SOL/min
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {status}
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
                    <span>{timeLeft}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>{progress.toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {isPayee && redeemableAmount.gt(new BN(0)) && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      Available to redeem: <span className="font-semibold">{formatTokenAmount(redeemableAmount)} SOL</span>
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  {isPayee && status === 'active' && redeemableAmount.gt(new BN(0)) && (
                    <button 
                      onClick={() => handleRedeem(stream)}
                      disabled={actionLoading === stream.publicKey.toString()}
                      className="btn-primary flex-1 text-sm py-2 disabled:opacity-50"
                    >
                      {actionLoading === stream.publicKey.toString() ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Redeeming...
                        </>
                      ) : (
                        'Redeem Available'
                      )}
                    </button>
                  )}
                  <button className="btn-secondary flex-1 text-sm py-2">
                    View Details
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      ))}
    </div>
  );
};