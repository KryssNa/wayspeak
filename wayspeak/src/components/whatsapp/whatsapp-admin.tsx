'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWhatsAppSocket } from './socket/whatsapp-socket';

export default function WhatsAppSetupPage() {
    const { connectionStatus, qrCode, isConnected, requestQR } = useWhatsAppSocket();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [qrExpired, setQrExpired] = useState(false);
    const [countdown, setCountdown] = useState(60);

    // Handle QR code expiration
    useEffect(() => {
        if (qrCode && !connectionStatus.authenticated) {
            setQrExpired(false);
            setCountdown(60);

            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setQrExpired(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [qrCode, connectionStatus.authenticated]);

    // Request QR code
    const handleRequestQR = async () => {
        try {
            setLoading(true);
            setError('');
            setQrExpired(false);

            // Use socket to request QR code
            requestQR();
        } catch (err) {
            console.error('Error requesting QR code:', err);
            setError('Failed to generate QR code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Disconnect WhatsApp
    const handleDisconnect = async () => {
        try {
            setLoading(true);

            const response = await fetch('/api/v1/whatsapp/disconnect', {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to disconnect');
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error disconnecting WhatsApp:', err);
            if (err instanceof Error) {
                setError(err.message || 'Failed to disconnect WhatsApp');
            } else {
                setError('Failed to disconnect WhatsApp');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">WhatsApp Connection Setup</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Status Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Connection Status</CardTitle>
                        <CardDescription>
                            Current status of your WhatsApp connection
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-4">
                            <div className="flex items-center space-x-2">
                                <div
                                    className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                />
                                <span>
                                    Socket: {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <div
                                    className={`w-4 h-4 rounded-full ${connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                />
                                <span>
                                    WhatsApp: {connectionStatus.connected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <div
                                    className={`w-4 h-4 rounded-full ${connectionStatus.authenticated ? 'bg-green-500' : 'bg-yellow-500'
                                        }`}
                                />
                                <span>
                                    Authentication: {connectionStatus.authenticated ? 'Authenticated' : 'Not authenticated'}
                                </span>
                            </div>

                            {success && (
                                <Alert className="bg-green-50 border-green-200 text-green-800">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Success</AlertTitle>
                                    <AlertDescription>
                                        Operation completed successfully
                                    </AlertDescription>
                                </Alert>
                            )}

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={handleRequestQR}
                            disabled={loading || connectionStatus.authenticated}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Connect
                                </>
                            )}
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={handleDisconnect}
                            disabled={loading || !connectionStatus.connected}
                        >
                            Disconnect
                        </Button>
                    </CardFooter>
                </Card>

                {/* QR Code Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>WhatsApp QR Code</CardTitle>
                        <CardDescription>
                            Scan with WhatsApp to connect your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                        {connectionStatus.authenticated ? (
                            <div className="text-center">
                                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                                <h3 className="text-xl font-medium text-green-600 mb-2">
                                    WhatsApp Connected
                                </h3>
                                <p className="text-gray-500">
                                    Your WhatsApp account is successfully connected
                                </p>
                            </div>
                        ) : loading ? (
                            <div className="text-center">
                                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                                <p>Generating QR code...</p>
                            </div>
                        ) : qrCode ? (
                            <div className="relative">
                                <img
                                    src={qrCode}
                                    alt="WhatsApp QR Code"
                                    className={`w-64 h-64 ${qrExpired ? 'opacity-30' : ''}`}
                                />

                                {!qrExpired && (
                                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
                                        {countdown}s
                                    </div>
                                )}

                                {qrExpired && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80">
                                        <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                                        <p className="text-center font-medium mb-2">QR Code expired</p>
                                        <Button size="sm" onClick={handleRequestQR}>
                                            Generate New QR
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center">
                                <Smartphone className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                                <p className="text-gray-500 mb-4">
                                    No QR code available. Click "Connect" to generate one.
                                </p>
                                <Button onClick={handleRequestQR}>Generate QR Code</Button>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col items-start text-sm text-gray-500">
                        <p className="mb-1">1. Open WhatsApp on your phone</p>
                        <p className="mb-1">2. Tap Menu or Settings and select Linked Devices</p>
                        <p>3. Point your phone to this screen to capture the QR code</p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}