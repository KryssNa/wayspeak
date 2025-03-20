import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client';
import { useAppDispatch } from '@/lib/redux/hooks/hooks';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const WhatsAppLogin = () => {
    const [qrCode, setQrCode] = useState('');
    const [qrLoading, setQrLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [clientId, setClientId] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Generate a new QR code
    const generateQR = async () => {
        try {
            setQrLoading(true);
            setErrorMessage('');

            // Generate a client ID if we don't have one
            const newClientId = clientId || Math.random().toString(36).substring(2, 15);
            if (!clientId) {
                setClientId(newClientId);
            }

            // Request QR code from API
            const response = await apiClient.post('/whatsapp-auth/qr', {
                clientId: newClientId,
            },);

            if (!response) {
                throw new Error('Failed to generate QR code');
            }

            const data = response;
            setQrCode(data.data.qrCode);
            setTimeRemaining(data.data.expiresIn);

            // Start checking authentication status
            startStatusCheck(newClientId);
        } catch (error) {
            console.error('Error generating QR code', error);
            setErrorMessage('Failed to generate QR code. Please try again.');
        } finally {
            setQrLoading(false);
        }
    };

    // Start checking authentication status periodically
    const startStatusCheck = (id: any) => {
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
                const response = await fetch(`http://localhost:5500/api/v1/whatsapp-auth/status/${id}`);

                if (!response.ok) {
                    throw new Error('Failed to check authentication status');
                }

                const data = await response.json();
                const { authenticated, qrExpired } = data.data;

                // If authenticated, handle successful login
                if (authenticated) {
                    clearInterval(interval);
                    clearInterval(countdownTimer);

                    // Get the user details from the server
                    const userResponse = await fetch('http://localhost:5500/api/v1/auth/me');

                    if (!userResponse.ok) {
                        throw new Error('Failed to get user details');
                    }

                    const userData = await userResponse.json();

                    // Dispatch login action
                    //   dispatch(login({
                    //     token: document.cookie.split('token=')[1]?.split(';')[0] || '',
                    //     user: userData.data.user
                    //   }));

                    // Redirect to dashboard
                    router.push('/dashboard');
                }

                // If QR code expired, generate a new one
                if (qrExpired && timeRemaining <= 0) {
                    clearInterval(interval);
                    clearInterval(countdownTimer);
                    setQrCode('');
                    setErrorMessage('QR code expired. Please try again.');
                }
            } catch (error) {
                console.error('Error checking authentication status', error);
            }
        }, 2000); // Check every 2 seconds

        setStatusCheckInterval(interval);
    };

    // Generate QR code on component mount
    useEffect(() => {
        generateQR();

        // Cleanup on unmount
        return () => {
            if (statusCheckInterval) {
                clearInterval(statusCheckInterval);
            }
        };
    }, []);

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Log in with WhatsApp</CardTitle>
                <CardDescription>
                    Scan the QR code with your WhatsApp app to log in
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center">
                {errorMessage && (
                    <div className="mb-4 text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <div className="relative p-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg mb-4">
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
                                QR code will appear here
                            </p>
                        </div>
                    )}
                </div>

                <div className="w-full text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        3. Point your phone to this screen to capture the QR code
                    </p>
                </div>
            </CardContent>

            <CardFooter className="flex justify-center">
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
                            Refresh QR Code
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default WhatsAppLogin;