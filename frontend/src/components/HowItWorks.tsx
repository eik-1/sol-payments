import React from 'react';
import { ArrowRight, Wallet, Settings, Play, Download } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Wallet,
      title: 'Connect Wallet',
      description: 'Connect your Solana wallet to get started with StreamPay',
      details: 'Support for Phantom, Solflare, and other popular Solana wallets'
    },
    {
      icon: Settings,
      title: 'Configure Stream',
      description: 'Set payment amount, rate per minute, duration, and fee structure',
      details: 'Flexible configuration options for any payment scenario'
    },
    {
      icon: Play,
      title: 'Start Streaming',
      description: 'Funds are escrowed and payments begin flowing automatically',
      details: 'Smart contracts handle all the complex payment logic'
    },
    {
      icon: Download,
      title: 'Redeem Payments',
      description: 'Recipients can claim their earned payments at any time',
      details: 'Real-time redemption with automatic fee distribution'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How StreamPay Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple, secure, and automated payment streaming in just four steps. 
            No complex integrations or manual processes required.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection lines for desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step card */}
                <div className="card text-center group hover:scale-105 transition-all duration-300 relative z-10">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className="bg-gradient-to-r from-primary-500 to-blue-500 p-4 rounded-xl mx-auto mb-6 w-fit group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {step.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    {step.details}
                  </p>
                </div>

                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-6 mb-2">
                    <ArrowRight className="w-6 h-6 text-primary-400 transform rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Example flow */}
        <div className="mt-20">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Example: Monthly Subscription
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 p-4 rounded-lg mb-4 mx-auto w-fit">
                  <span className="text-2xl font-bold text-blue-600">$100</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Total Amount</h4>
                <p className="text-gray-600 text-sm">Monthly subscription payment</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-lg mb-4 mx-auto w-fit">
                  <span className="text-2xl font-bold text-green-600">$3.33</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Per Day</h4>
                <p className="text-gray-600 text-sm">Continuous daily streaming</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 p-4 rounded-lg mb-4 mx-auto w-fit">
                  <span className="text-2xl font-bold text-purple-600">30</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Days</h4>
                <p className="text-gray-600 text-sm">Stream duration</p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-center text-gray-700">
                <span className="font-semibold">Result:</span> Recipient can claim earned payments 
                daily instead of waiting for the full month. If they leave after 15 days, 
                the remaining $50 is automatically returned to the payer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};