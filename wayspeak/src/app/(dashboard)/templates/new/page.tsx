'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks/hooks';
import { createTemplate } from '@/lib/redux/features/templatesSlice';
import { TemplateVariable } from '@/lib/types/templates';

export default function NewTemplatePage() {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'text' | 'image' | 'video' | 'document'>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [newVarName, setNewVarName] = useState('');
  const [newVarDesc, setNewVarDesc] = useState('');
  const [newVarRequired, setNewVarRequired] = useState(false);
  const [error, setError] = useState('');
  
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(state => state.templates);
  const router = useRouter();
  
  const addVariable = () => {
    if (!newVarName) {
      setError('Variable name is required');
      return;
    }
    
    // Check if variable already exists
    if (variables.some(v => v.name === newVarName)) {
      setError(`Variable ${newVarName} already exists`);
      return;
    }
    
    setVariables([
      ...variables,
      {
        name: newVarName,
        description: newVarDesc || `Replace with ${newVarName}`,
        required: newVarRequired
      }
    ]);
    
    // Reset form
    setNewVarName('');
    setNewVarDesc('');
    setNewVarRequired(false);
    setError('');
  };
  
  const removeVariable = (name: string) => {
    setVariables(variables.filter(v => v.name !== name));
  };
  
  const insertVariable = (name: string) => {
    setContent(content + `{{${name}}}`);
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name || !content) {
      setError('Template name and content are required');
      return;
    }
    
    if (['image', 'video', 'document'].includes(type) && !mediaUrl) {
      setError(`Media URL is required for ${type} templates`);
      return;
    }
    
    setError('');
    
    try {
      const resultAction = await dispatch(
        createTemplate({
          name,
          content,
          type,
          mediaUrl: ['image', 'video', 'document'].includes(type) ? mediaUrl : undefined,
          variables
        })
      );
      
      if (createTemplate.fulfilled.match(resultAction)) {
        // Template created successfully
        router.push('/templates');
      } else {
        // Template creation failed
        setError(resultAction.payload as string || 'Failed to create template');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    }
  };
  
  const extractVariables = () => {
    const regex = /{{([^{}]+)}}/g;
    const matches = [...content.matchAll(regex)];
    const extracted = matches.map(match => match[1]);
    
    // For each extracted variable, check if it exists in the variables array
    extracted.forEach(varName => {
      if (!variables.some(v => v.name === varName)) {
        setVariables([
          ...variables,
          {
            name: varName,
            description: `Replace with ${varName}`,
            required: false
          }
        ]);
      }
    });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">New Template</h1>
        <p className="text-muted-foreground">
          Create a reusable message template with variables
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name
                </label>
                <Input
                  id="name"
                  placeholder="e.g. Welcome Message"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Type
                </label>
                <select
                  id="type"
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={type}
                  onChange={(e) => setType(e.target.value as 'text' | 'image' | 'video' | 'document')}
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                </select>
              </div>
              
              {['image', 'video', 'document'].includes(type) && (
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
                  Template Content
                </label>
                <textarea
                  id="content"
                  className="block w-full min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                  placeholder="Type your message template here... Use {{variable}} for placeholders"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onBlur={() => extractVariables()}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use {'{{variable_name}}'} syntax to add variables
                </p>
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
                loadingText="Creating..."
              >
                Create Template
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <label htmlFor="varName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add Variable
                  </label>
                  <Input
                    id="varName"
                    placeholder="Variable Name"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                  />
                  <Input
                    id="varDesc"
                    placeholder="Description (optional)"
                    value={newVarDesc}
                    onChange={(e) => setNewVarDesc(e.target.value)}
                  />
                  <div className="flex items-center mt-1">
                    <input
                      id="varRequired"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={newVarRequired}
                      onChange={(e) => setNewVarRequired(e.target.checked)}
                    />
                    <label htmlFor="varRequired" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Required
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={addVariable}
                  >
                    Add Variable
                  </Button>
                </div>
                
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Template Variables</h4>
                  {variables.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No variables added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {variables.map((variable) => (
                        <div
                          key={variable.name}
                          className="flex items-center justify-between p-2 text-sm border rounded-md bg-muted/20"
                        >
                          <div>
                            <div className="font-medium flex items-center">
                              <span>{variable.name}</span>
                              {variable.required && (
                                <span className="ml-1 text-red-500">*</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {variable.description}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => insertVariable(variable.name)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 15H9v6" />
                                <path d="M9 9h6V3" />
                                <path d="M9 15 3 9" />
                                <path d="M15 9 21 3" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => removeVariable(variable.name)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-32">
                {content ? (
                  <div className="break-words">
                    {['image', 'video'].includes(type) && mediaUrl && (
                      <div className="mb-2 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 aspect-video flex items-center justify-center">
                        {type === 'image' ? (
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
                    
                    {type === 'document' && mediaUrl && (
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
                    
                    <p>{content.replace(/{{([^{}]+)}}/g, (match, varName) => {
                      return `<span class="px-1 bg-primary/20 text-primary rounded">${varName}</span>`;
                    })}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Your template preview will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
