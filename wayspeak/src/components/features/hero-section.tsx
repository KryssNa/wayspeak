'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] },
  },
};

const floatingPhoneVariants = {
  initial: { y: 0 },
  float: {
    y: [-10, 10],
    transition: {
      y: {
        duration: 3,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      },
    },
  },
};

const conversationMessages = [
  { id: 1, text: "Hello! I'd like to inquire about your services.", isUser: false },
  { id: 2, text: "Hi there! We offer premium API solutions for WhatsApp business integration.", isUser: true },
  { id: 3, text: "That sounds interesting. Can you tell me more about pricing?", isUser: false },
  { id: 4, text: "Sure! We have flexible plans starting at $49/month with unlimited messages.", isUser: true },
];

export function HeroSection() {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);

  useEffect(() => {
    if (inView) {
      const interval = setInterval(() => {
        setVisibleMessages((prev) => {
          const next = conversationMessages
            .slice(0, prev.length + 1)
            .map((message) => message.id);
          if (next.length === conversationMessages.length) {
            clearInterval(interval);
          }
          return next;
        });
      }, 800);

      return () => clearInterval(interval);
    } else {
      setVisibleMessages([]);
    }
  }, [inView]);

  return (
    <section className="pt-32 pb-24 overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/20 -z-10" />

      {/* Animated background dots */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{
            backgroundPosition: ['0px 0px', '100px 100px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'loop',
          }}
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center lg:text-left max-w-xl mx-auto lg:mx-0"
          >
            <motion.div variants={itemVariants}>
              <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                The Ultimate WhatsApp API Platform
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              Connect and Engage With Your Customers
              <span className="text-primary"> Effortlessly</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0"
            >
              WaySpeak provides powerful WhatsApp API solutions that let you automate
              conversations, send messages at scale, and build meaningful connections with your customers.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button size="lg">
                <Link href="/signup">Get Started for Free</Link>
              </Button>
              <Button size="lg" variant="outline">
                <Link href="/docs">View Documentation</Link>
              </Button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-8 flex items-center justify-center lg:justify-start gap-6"
            >
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white dark:border-gray-800 overflow-hidden"
                  >
                    <img
                      src={`https://i.pravatar.cc/100?img=${i + 10}`}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">1,000+</strong> businesses trust us
              </div>
            </motion.div>
          </motion.div>

          {/* Illustration/Demo */}
          <motion.div
            ref={ref}
            initial="initial"
            animate="float"
            variants={floatingPhoneVariants}
            className="relative"
          >
            <div className="relative mx-auto max-w-sm">
              {/* Phone frame */}
              <div className="relative mx-auto w-[280px] h-[570px] bg-gray-900 rounded-[40px] shadow-xl overflow-hidden border-[10px] border-gray-800">
                {/* Phone screen */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                  {/* Status bar */}
                  <div className="h-6 bg-gray-800 text-white flex items-center justify-between px-4 text-xs">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 18.8C4 18.8 5 18 8 18C11 18 13 20 16 20C19 20 20 19.2 20 19.2V4.8C20 4.8 19 5.6 16 5.6C13 5.6 11 3.6 8 3.6C5 3.6 4 4.8 4 4.8V18.8Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M7.33341 2H16.6667C18.5077 2 20.0001 3.49238 20.0001 5.33333V18.6667C20.0001 20.5076 18.5077 22 16.6667 22H7.33341C5.49246 22 4.00008 20.5076 4.00008 18.6667V5.33333C4.00008 3.49238 5.49246 2 7.33341 2ZM16.6667 20C17.403 20 18.0001 19.403 18.0001 18.6667V5.33333C18.0001 4.59695 17.403 4 16.6667 4H7.33341C6.59703 4 6.00008 4.59695 6.00008 5.33333V18.6667C6.00008 19.403 6.59703 20 7.33341 20H16.6667Z"
                          fill="currentColor"
                        />
                        <path
                          d="M9 6.5C9 7.32843 8.32843 8 7.5 8C6.67157 8 6 7.32843 6 6.5C6 5.67157 6.67157 5 7.5 5C8.32843 5 9 5.67157 9 6.5Z"
                          fill="currentColor"
                        />
                      </svg>
                      <svg width="14" height="14" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M17 4h-3V2h-4v2H7v18h10V4z"
                          opacity=".3"
                        ></path>
                        <path
                          fill="currentColor"
                          d="M17 4v18H7V4h10m0-2H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
                        ></path>
                        <path
                          fill="currentColor"
                          d="M15 7H9v2h6V7zm0 4H9v2h6v-2zm0 4H9v2h6v-2z"
                        ></path>
                      </svg>
                    </div>
                  </div>

                  {/* App interface */}
                  <div className="pt-10 px-3 h-full">
                    <div className="bg-white dark:bg-gray-800 rounded-t-xl p-3 shadow-lg h-[480px] flex flex-col">
                      {/* App header */}
                      <div className="flex items-center gap-3 border-b pb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          WS
                        </div>
                        <div>
                          <div className="font-semibold">WaySpeak Support</div>
                          <div className="text-xs text-green-500">Online</div>
                        </div>
                      </div>

                      {/* Messages container */}
                      <div className="flex-1 overflow-y-auto pt-3 flex flex-col gap-3">
                        {conversationMessages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={
                              visibleMessages.includes(message.id)
                                ? { opacity: 1, y: 0, scale: 1 }
                                : { opacity: 0, y: 20, scale: 0.95 }
                            }
                            transition={{ duration: 0.3 }}
                            className={`flex ${
                              message.isUser ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                                message.isUser
                                  ? 'bg-primary text-white rounded-br-none'
                                  : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'
                              }`}
                            >
                              {message.text}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Message input */}
                      <div className="mt-2 pt-2 border-t flex items-center gap-2">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-2 flex-1 text-xs text-gray-400">
                          Type a message...
                        </div>
                        <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white" 
                        title='Send message'
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m3 3 3 9-3 9 19-9Z" />
                            <path d="M6 12h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone notch */}
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center">
                  <div className="w-40 h-6 bg-gray-800 rounded-b-xl" />
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-14 -top-10 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
              <div className="absolute -left-16 -bottom-10 w-32 h-32 bg-secondary/20 rounded-full blur-xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
