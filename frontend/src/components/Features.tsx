import React from 'react';
import { 
  Clock, 
  Shield, 
  Zap, 
  DollarSign, 
  Users, 
  BarChart3,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: Clock,
      title: 'Continuous Streaming',
      description: 'Set up payment streams that flow automatically by the minute, perfect for subscriptions, salaries, and recurring payments.',
      benefits: ['Automated payments', 'Minute-by-minute precision', 'No manual intervention needed']
    },
    {
      icon: Shield,
      title: 'Secure Escrow System',
      description: 'Funds are safely locked in escrow accounts with smart contract protection and automatic release mechanisms.',
      benefits: ['Smart contract security', 'Automatic fund release', 'Dispute protection']
    },
    {
      icon: Zap,
      title: 'Solana-Powered Speed',
      description: 'Lightning-fast transactions with minimal fees, leveraging Solana\'s high-performance blockchain infrastructure.',
      benefits: ['Sub-second transactions', 'Ultra-low fees', 'High throughput']
    },
    {
      icon: DollarSign,
      title: 'Flexible Fee Structure',
      description: 'Customizable fee percentages for service providers with transparent fee distribution and collection.',
      benefits: ['Custom fee rates', 'Transparent pricing', 'Automatic collection']
    },
    {
      icon: Users,
      title: 'Multi-Party Support',
      description: 'Support for complex payment scenarios with multiple payers, payees, and fee recipients.',
      benefits: ['Multiple participants', 'Role-based access', 'Flexible configurations']
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Track payment flows, redemption rates, and stream performance with comprehensive analytics dashboard.',
      benefits: ['Live monitoring', 'Performance metrics', 'Historical data']
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Payments
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to implement streaming payments in your application, 
            from simple subscriptions to complex multi-party agreements.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="card group hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-primary-500 to-blue-500 p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {feature.description}
              </p>
              
              <ul className="space-y-2">
                {feature.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform duration-200">
                  Learn more
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Ready to revolutionize your payment system?
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join the future of payments with our streaming protocol. Start building 
              today with our comprehensive SDK and documentation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">
                Start Building
              </button>
              <button className="btn-secondary">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};