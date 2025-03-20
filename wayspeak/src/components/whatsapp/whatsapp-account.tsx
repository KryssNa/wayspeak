import React, { useState, useEffect, JSX } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertCircle, CheckCircle, Phone, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useWhatsAppSocket } from './socket/whatsapp-socket';
// import { useWhatsAppSocket } from '@/lib/hooks/use-whatsapp-socket';

// Define account interface
interface WhatsAppAccount {
  id: string;
  name: string;
  phoneNumber: string;
  businessId?: string;
  status: 'connected' | 'disconnected' | 'pending' | string;
  type: string;
  connectedAt: string;
}

const WhatsAppAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showQrDialog, setShowQrDialog] = useState<boolean>(false);
  const { qrCode, connectionStatus, requestQR } = useWhatsAppSocket();

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch WhatsApp accounts
  const fetchAccounts = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:5500/api/v1/whatsapp/accounts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      const data = await response.json();
      setAccounts(data.data.accounts);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Failed to load WhatsApp accounts');
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async (accountId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to disconnect this WhatsApp account?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:5500/api/v1/whatsapp/accounts/${accountId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      // Refresh accounts list
      fetchAccounts();
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to disconnect account');
    } finally {
      setLoading(false);
    }
  };

  // Start QR connection process
  const handleConnectAccount = (): void => {
    setShowQrDialog(true);
    requestQR();
  };

  // Render connection status badge
  const renderStatusBadge = (status: string): JSX.Element => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            Disconnected
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">WhatsApp Accounts</h1>
        <Button onClick={handleConnectAccount}>
          <Plus className="w-4 h-4 mr-2" />
          Connect Account
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading && accounts.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10">
            <Phone className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No WhatsApp Accounts</h3>
            <p className="text-gray-500 mb-6 text-center">
              You haven't connected any WhatsApp accounts yet.
              Connect an account to start sending messages.
            </p>
            <Button onClick={handleConnectAccount}>
              <Plus className="w-4 h-4 mr-2" />
              Connect WhatsApp
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{account.name || 'WhatsApp Account'}</CardTitle>
                    {renderStatusBadge(account.status)}
                  </div>
                  <CardDescription>
                    {account.phoneNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Business ID:</span>
                      <span className="font-mono">{account.businessId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Connected:</span>
                      <span>{new Date(account.connectedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type:</span>
                      <span className="capitalize">{account.type}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchAccounts()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteAccount(account.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect WhatsApp Account</DialogTitle>
            <DialogDescription>
              Scan this QR code with your WhatsApp to connect your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center p-4">
            {qrCode ? (
              <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            )}
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>1. Open WhatsApp on your phone</p>
            <p>2. Tap Menu or Settings and select Linked Devices</p>
            <p>3. Point your phone to this screen</p>
          </div>
          
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => requestQR()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowQrDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppAccountsPage;