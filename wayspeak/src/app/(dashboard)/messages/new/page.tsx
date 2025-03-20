'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks/hooks';
import { sendMessage } from '@/lib/redux/features/messagesSlice';
import { MessageType } from '@/lib/types/messages';

export default function NewMessagePage() {
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');
  const [messageType, setMessageType] = useState<MessageType>(MessageType.TEXT);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [error, setError] = useState('');
  
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(state => state.messages);
  const router = useRouter();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !content) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (['image', 'audio', 'video', 'document'].includes(messageType) && !mediaUrl) {
      setError(`Media URL is required for ${messageType} messages`);
      return;
    }
    
    setError('');
    
    try {
      const resultAction = await dispatch(
        sendMessage({
          to: recipient,
          content,
          type: messageType,
          mediaUrl: ['image', 'audio', 'video', 'document'].includes(messageType) ? mediaUrl : undefined,
          isHighPriority
        })
      );
      
      if (sendMessage.fulfilled.match(resultAction)) {
        // Message sent successfully
        router.push('/messages');
      } else {
        // Message sending failed
        setError(resultAction.payload as string || 'Failed to send message');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">New Message</h1>
        <p className="text-muted-foreground">
          Compose and send a new message
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Message Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recipient Phone Number
                </label>
                <Input
                  id="recipient"
                  placeholder="e.g. +1234567890"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter phone number with country code
                </p>
              </div>
              
              <div>
                <label htmlFor="messageType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message Type
                </label>
                <select
                  id="messageType"
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value as MessageType)}
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                </select>
              </div>
              
              {['image', 'audio', 'video', 'document'].includes(messageType) && (
                <div>
                  <label htmlFor="mediaUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Media URL
                  </label>
                  <Input
                    id="mediaUrl"
                    placeholder="https://example.com/media.jpg"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message Content
                </label>
                <textarea
                  id="content"
                  className="block w-full min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                  placeholder="Type your message here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex items-center mt-4">
                <input
                  id="priority"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={isHighPriority}
                  onChange={(e) => setIsHighPriority(e.target.checked)}
                />
                <label htmlFor="priority" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  High Priority
                </label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                loadingText="Sending..."
              >
                Send Message
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Message Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-32">
                {content ? (
                  <div className="break-words">
                    {['image', 'video'].includes(messageType) && mediaUrl && (
                      <div className="mb-2 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 aspect-video flex items-center justify-center">
                        {messageType === 'image' ? (
                          <div className="text-xs text-muted-foreground flex flex-col items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                            <span>Image Preview</span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground flex flex-col items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m14 8-4 4 4 4" />
                              <rect width="20" height="16" x="2" y="4" rx="2" />
                            </svg>
                            <span>Video Preview</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {messageType === 'audio' && mediaUrl && (
                      <div className="mb-2 p-2 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <div className="text-xs text-muted-foreground flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M2 11.5a9 9 0 0 1 18 0" />
                            <path d="M9 14a3 3 0 0 1 6 0" />
                            <circle cx="12" cy="16.5" r="2.5" />
                          </svg>
                          <span>Audio Message</span>
                        </div>
                      </div>
                    )}
                    
                    {messageType === 'document' && mediaUrl && (
                      <div className="mb-2 p-2 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center">
                        <div className="text-xs text-muted-foreground flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span>Document</span>
                        </div>
                      </div>
                    )}
                    
                    <p>{content}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Your message preview will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-primary mt-0.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Include country code with phone number
                </li>
                <li className="flex gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-primary mt-0.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Keep messages concise and clear
                </li>
                <li className="flex gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-primary mt-0.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Use templates for consistent messaging
                </li>
                <li className="flex gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-primary mt-0.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Only use high priority for urgent messages
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
