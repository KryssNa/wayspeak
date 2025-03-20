'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  AnimatedSection, 
  StaggerContainer, 
  StaggerItem 
} from '@/components/ui/animated-section';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    title: 'Seamless Integration',
    description:
      'Connect to WhatsApp Business API in minutes with our easy-to-use platform. No technical knowledge required.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: 'Automated Messaging',
    description:
      'Schedule and automate messages to engage with your customers at scale, saving time and resources.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Interactive Templates',
    description:
      'Create reusable message templates with dynamic variables for personalized customer interactions.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      </svg>
    ),
  },
  {
    title: 'Media Support',
    description:
      'Send and receive images, videos, documents, and other media types to enhance your communication.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    title: 'Analytics Dashboard',
    description:
      'Track message delivery, engagement rates, and customer interactions with detailed analytics.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    title: 'Webhook Integrations',
    description:
      'Connect with your existing systems via webhooks to create a seamless business workflow.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
        />
      </svg>
    ),
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });

  return (
    <section className="py-20 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900/30" id="features">
      <div className="container">
        <AnimatedSection animation="slideUp" className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features for Your Business
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to connect with your customers through WhatsApp,
            all in one powerful platform.
          </p>
        </AnimatedSection>

        <StaggerContainer
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          ref={ref}
        >
          {features.map((feature, index) => (
            <StaggerItem key={index} animation="slideUp">
              <Card className="h-full border-none shadow-lg hover:shadow-xl transition-shadow bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                <CardContent className="p-6">
                  <div className="mb-4 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Animated feature highlight */}
        <AnimatedSection animation="slideUp" className="mt-20 max-w-4xl mx-auto">
          <div className="relative rounded-xl overflow-hidden shadow-2xl">
            {/* Feature showcase animation */}
            <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 p-8 flex flex-col items-center justify-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="z-10 text-center"
              >
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Advanced Analytics Dashboard
                </h3>
                <p className="text-gray-300 max-w-xl mb-8">
                  Track your campaign performance, message delivery rates, and customer
                  engagement metrics in real-time.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="relative w-full max-w-3xl mx-auto z-10"
              >
                <div className="bg-gray-800/80 backdrop-blur border border-gray-700 rounded-lg shadow-xl p-4">
                  <div className="flex items-center justify-between border-b border-gray-700 pb-3 mb-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="text-xs text-gray-400">Dashboard • Last 30 days</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      { label: 'Messages Sent', value: '24,521' },
                      { label: 'Open Rate', value: '87.3%' },
                      { label: 'Response Rate', value: '62.1%' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-gray-900/60 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">{stat.label}</div>
                        <div className="text-xl font-semibold">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-900/60 rounded-lg p-4 h-32 flex items-end">
                    {[30, 45, 25, 60, 75, 65, 50, 80, 70, 90, 85, 60].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={isInView ? { height: `${h}%` } : {}}
                        transition={{ delay: 0.8 + i * 0.05, duration: 0.6 }}
                        className="w-full bg-primary rounded-sm mx-0.5"
                        style={{ maxWidth: '20px' }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* Background decoration */}
              <div className="absolute top-40 -right-10 w-60 h-60 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
