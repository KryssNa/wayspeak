'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks/hooks';
import { fetchMessages } from '@/lib/redux/features/messagesSlice';
import { fetchDeliveryStats } from '@/lib/redux/features/analyticsSlice';
import { MessageStatus } from '@/lib/types/messages';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] },
  },
};

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { messages } = useAppSelector(state => state.messages);
  const { deliveryStats } = useAppSelector(state => state.analytics);
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchMessages(
      { limit: 5 }
    ));
    dispatch(fetchDeliveryStats());
  }, [dispatch]);

  const getStatusColor = (status: MessageStatus) => {
    switch (status) {
      case 'sent': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      case 'read': return 'bg-purple-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const stats = [
    {
      title: 'Total Messages',
      // value: deliveryStats?.total || 0,
      value:  0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    },
    {
      title: 'Delivered',
      value: deliveryStats?.delivered || 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      ),
      color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    },
    {
      title: 'Read',
      value: deliveryStats?.read || 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1" />
          <path d="M 15 10v2a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-2" />
          <path d="m8 18 4-4 4 4" />
          <path d="M12 14v8" />
        </svg>
      ),
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
    },
    {
      title: 'Failed',
      value: deliveryStats?.failed || 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      ),
      color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold">Welcome, {user?.name || 'User'}</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your messages today
          </p>
        </motion.div>
        <motion.div variants={itemVariants} className="mt-4 md:mt-0">
          <Button variant="primary" size="sm" >
            <Link href="/messages/new">
              <svg className="mr-2 -ml-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              New Message
            </Link>
          </Button>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  </div>
                  <div className={`p-2 rounded-full ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Messages</CardTitle>
            <Button variant="outline" size="sm" >
              <Link href="/messages">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase border-b bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3">Recipient</th>
                      <th scope="col" className="px-6 py-3">Message</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages && messages.length > 0 ? (
                      messages.slice(0, 5).map((message) => (
                        <tr key={message.id} className="bg-white dark:bg-gray-900 border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 font-medium">{message.to}</td>
                          <td className="px-6 py-4 truncate max-w-[200px]">{message.content}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)} text-white`}>
                              {message.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">{new Date(message.timestamp).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="bg-white dark:bg-gray-900 border-b">
                        <td colSpan={4} className="px-6 py-4 text-center">No messages yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" >
              <Link href="/templates">
                <svg className="mr-2 w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Z" />
                  <path d="M4 13a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6Z" />
                </svg>
                Create Message Template
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" >
              <Link href="/webhooks/new">
                <svg className="mr-2 w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 11.5V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1.4" />
                  <path d="M14 10V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                  <path d="M10 9.9V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
                  <path d="M6 14v0a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2" />
                  <path d="M18 14v-3" />
                </svg>
                Configure Webhook
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" >
              <Link href="/analytics">
                <svg className="mr-2 w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                View Analytics
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" >
              <Link href="/settings">
                <svg className="mr-2 w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Update Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Quick Start Guide</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                Welcome to WaySpeak! Here are some steps to get you started:
              </p>
              <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-2 list-decimal list-inside">
                <li>Configure your WhatsApp Business Account</li>
                <li>Create message templates for common responses</li>
                <li>Set up webhooks to receive real-time notifications</li>
                <li>Send your first message</li>
              </ol>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" size="sm" >
                <Link href="/docs">
                  View Documentation
                </Link>
              </Button>
              <Button size="sm" >
                <Link href="/support">
                  Get Support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
