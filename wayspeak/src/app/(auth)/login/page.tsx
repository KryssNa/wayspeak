'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api/client';
import { login, } from '@/lib/redux/features/authSlice';
import { useAppDispatch } from '@/lib/redux/hooks/hooks';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [clientId, setClientId] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);

  const dispatch = useAppDispatch();
  const router = useRouter();

  // Generate QR code when component mounts or tab changes
  useEffect(() => {
    return () => {
      // Clean up interval on unmount
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Dispatch login action
      const resultAction = await dispatch(login({ email, password }));

      if (login.fulfilled.match(resultAction)) {
        // Login successful, redirect to dashboard
        router.push('/dashboard');
      } else {
        // Login failed
        setError(resultAction.payload as string || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a new QR code for WhatsApp login
  const generateQR = async () => {
    try {
      setQrLoading(true);
      setQrError('');

      // Generate a client ID if we don't have one
      const newClientId = clientId || Math.random().toString(36).substring(2, 15);
      if (!clientId) {
        setClientId(newClientId);
      }

      // Request QR code from API
      const response = await apiClient.post('/whatsapp-auth/qr', {
        clientId: newClientId
      });

      if (!response) {
        throw new Error('Failed to generate QR code');
      }

      const data = response.data;
      setQrCode(data.data.qrCode);
      setTimeRemaining(data.data.expiresIn);

      // Start checking authentication status
      startStatusCheck(newClientId);
    } catch (err) {
      console.error('Error generating QR code', err);
      setQrError('Failed to generate QR code. Please try again.');
    } finally {
      setQrLoading(false);
    }
  };

  // Start checking authentication status periodically
  const startStatusCheck = (id: string) => {
    // Clear any existing interval
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }

    // Create countdown timer
    const countdownTimer = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Start checking status
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/whatsapp-auth/status/${id}`);

        if (!response) {
          throw new Error('Failed to check authentication status');
        }

        const data = response.data;
        const { authenticated, qrExpired } = data.data;

        // If authenticated, handle successful login
        if (authenticated) {
          clearInterval(interval);
          clearInterval(countdownTimer);

          // Get the user details from the server
          const userResponse = await fetch('/api/v1/auth/me');

          if (!userResponse.ok) {
            throw new Error('Failed to get user details');
          }

          const userData = await userResponse.json();

          // Dispatch login action
          // dispatch(loginWithToken({
          //   token: document.cookie.split('token=')[1]?.split(';')[0] || '',
          //   user: userData.data.user
          // }));

          // Redirect to dashboard
          router.push('/dashboard');
        }

        // If QR code expired, generate a new one
        if (qrExpired && timeRemaining <= 0) {
          clearInterval(interval);
          clearInterval(countdownTimer);
          setQrCode('');
          setQrError('QR code expired. Please try again.');
        }
      } catch (error) {
        console.error('Error checking authentication status', error);
      }
    }, 2000); // Check every 2 seconds

    setStatusCheckInterval(interval);
  };

  const handleTabChange = (value: string) => {
    if (value === 'whatsapp' && !qrCode && !qrLoading) {
      generateQR();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <Link href="/" className="flex justify-center">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-md flex items-center justify-center font-bold text-lg">
              W
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow-md rounded-lg sm:px-10">
          <Tabs defaultValue="email" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded-md text-sm flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email address
                  </label>
                  <div className="mt-1">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="mt-1">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="whatsapp">
              {qrError && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded-md text-sm flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{qrError}</span>
                </div>
              )}

              <div className="flex flex-col items-center space-y-6">
                <div className="relative p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {qrLoading ? (
                    <div className="w-64 h-64 flex items-center justify-center">
                      <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </div>
                  ) : qrCode ? (
                    <>
                      <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                      {timeRemaining > 0 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
                          {timeRemaining}s
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <p className="text-center text-gray-500 dark:text-gray-400 px-6">
                        Click "Generate QR Code" below to login with WhatsApp
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 text-center">
                  <p>1. Open WhatsApp on your phone</p>
                  <p>2. Tap Menu or Settings and select Linked Devices</p>
                  <p>3. Point your phone to this screen to capture the QR code</p>
                </div>

                <Button
                  variant="outline"
                  onClick={generateQR}
                  disabled={qrLoading}
                  className="w-full"
                >
                  {qrLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {qrCode ? "Refresh QR Code" : "Generate QR Code"}
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.022A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.841-2.337 4.687-4.565 4.934.359.309.678.918.678 1.85 0 1.337-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                    clipRule="evenodd"
                  />
                </svg>
                Continue with GitHub
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}