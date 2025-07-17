import React from 'react';
import { ArrowRight, Play, Shield, Zap, Clock } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';

export const Hero: React.FC = () => {
  const { connected } = useWallet();

  const scrollToDashboard = () => {
    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20 lg:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-primary-400 to-blue-400 rounded-full blur-3xl opacity-10"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4 mr-2" />
            Built on Solana • Lightning Fast • Low Fees
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 animate-slide-up">
            Stream Payments
            <span className="block gradient-text">In Real-Time</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up">
            Revolutionary payment streaming protocol on Solana. Send continuous payments 
            by the minute with automatic redemption and built-in fee management.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-slide-up">
            <button 
              onClick={scrollToDashboard}
              className="btn-primary flex items-center space-x-2 text-lg px-8 py-4"
            >
              <span>{connected ? 'Go to Dashboard' : 'Get Started'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button className="btn-secondary flex items-center space-x-2 text-lg px-8 py-4">
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 animate-fade-in">
              <div className="bg-primary-100 p-3 rounded-lg mb-4">
                <Clock className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-Time Streaming</h3>
              <p className="text-gray-600 text-sm">Payments flow continuously by the minute, not in bulk transfers</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 animate-fade-in">
              <div className="bg-green-100 p-3 rounded-lg mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Escrow</h3>
              <p className="text-gray-600 text-sm">Funds are safely held in escrow until redemption or expiration</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 animate-fade-in">
              <div className="bg-purple-100 p-3 rounded-lg mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600 text-sm">Built on Solana for instant transactions and minimal fees</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};