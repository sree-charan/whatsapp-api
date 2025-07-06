import React, { useState } from 'react';
import { 
  Code, 
  Key, 
  Copy, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  BookOpen, 
  Terminal, 
  Zap, 
  Globe, 
  Lock, 
  FileText, 
  Send, 
  Image, 
  Paperclip, 
  Webhook, 
  Settings, 
  Play, 
  Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Card, 
  Badge, 
  Button, 
  useToast 
} from '../components/ui';

const ApiPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [copySuccess, setCopySuccess] = useState('');

  const handleCopyCode = async (code, section) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(section);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast.error('Failed to copy code');
    }
  };

  const maskApiKey = (apiKey) => {
    if (!apiKey) return 'your-api-key-here';
    return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 8)}`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'authentication', label: 'Authentication', icon: Shield },
    { id: 'endpoints', label: 'Endpoints', icon: Globe },
    { id: 'examples', label: 'Examples', icon: Code },
    { id: 'testing', label: 'Testing', icon: Terminal },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook }
  ];

  const endpoints = [
    {
      category: 'Authentication',
      icon: Lock,
      color: 'primary',
      endpoints: [
        { method: 'POST', path: '/auth/login', description: 'Authenticate user' },
        { method: 'POST', path: '/auth/register', description: 'Register new user' },
        { method: 'GET', path: '/auth/profile', description: 'Get user profile' },
        { method: 'POST', path: '/auth/regenerate-api-key', description: 'Regenerate API key' }
      ]
    },
    {
      category: 'Sessions',
      icon: Settings,
      color: 'whatsapp',
      endpoints: [
        { method: 'GET', path: '/sessions', description: 'List all sessions' },
        { method: 'POST', path: '/sessions', description: 'Create new session' },
        { method: 'GET', path: '/sessions/:id', description: 'Get session details' },
        { method: 'DELETE', path: '/sessions/:id', description: 'Delete session' },
        { method: 'POST', path: '/sessions/:id/restart', description: 'Restart session' }
      ]
    },
    {
      category: 'Messages',
      icon: Send,
      color: 'success',
      endpoints: [
        { method: 'POST', path: '/messages/send/text', description: 'Send text message' },
        { method: 'POST', path: '/messages/send/image', description: 'Send image message' },
        { method: 'POST', path: '/messages/send/document', description: 'Send document' },
        { method: 'POST', path: '/messages/upload', description: 'Upload media file' },
        { method: 'GET', path: '/messages/history/:sessionId', description: 'Get message history' }
      ]
    },
    {
      category: 'Webhooks',
      icon: Webhook,
      color: 'secondary',
      endpoints: [
        { method: 'GET', path: '/webhook/config/:sessionId', description: 'Get webhook config' },
        { method: 'POST', path: '/webhook/config/:sessionId', description: 'Set webhook URL' },
        { method: 'DELETE', path: '/webhook/config/:sessionId', description: 'Remove webhook' }
      ]
    },
    {
      category: 'Status',
      icon: AlertCircle,
      color: 'warning',
      endpoints: [
        { method: 'GET', path: '/status/stats', description: 'Get system statistics' },
        { method: 'GET', path: '/status/health', description: 'Health check' }
      ]
    }
  ];

  const codeExamples = {
    curl: `curl -X POST "http://localhost:3001/api/messages/send/text" \\
  -H "Authorization: Bearer ${maskApiKey(user?.apiKey)}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "your-session-id",
    "to": "+1234567890",
    "text": "Hello from WhatsApp API!"
  }'`,
    javascript: `const response = await fetch('http://localhost:3001/api/messages/send/text', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${maskApiKey(user?.apiKey)}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sessionId: 'your-session-id',
    to: '+1234567890',
    text: 'Hello from WhatsApp API!'
  })
});

const result = await response.json();
console.log(result);`,
    python: `import requests
import json

url = "http://localhost:3001/api/messages/send/text"
headers = {
    "Authorization": "Bearer ${maskApiKey(user?.apiKey)}",
    "Content-Type": "application/json"
}
data = {
    "sessionId": "your-session-id",
    "to": "+1234567890",
    "text": "Hello from WhatsApp API!"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,
    php: `<?php
$url = "http://localhost:3001/api/messages/send/text";
$headers = [
    "Authorization: Bearer ${maskApiKey(user?.apiKey)}",
    "Content-Type: application/json"
];
$data = json_encode([
    "sessionId" => "your-session-id",
    "to" => "+1234567890",
    "text" => "Hello from WhatsApp API!"
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 via-primary-700/95 to-primary-800/90"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Code className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
              <p className="text-primary-100 text-lg">
                Complete WhatsApp API reference with interactive examples
              </p>
              <div className="flex items-center space-x-4 mt-4">
                <Badge variant="success" className="bg-white/20 text-white border-white/30">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Live API
                </Badge>
                <Badge variant="primary" className="bg-white/20 text-white border-white/30">
                  <Zap className="w-4 h-4 mr-1" />
                  Real-time
                </Badge>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            <Button
              onClick={() => window.open('https://baileys.wiki', '_blank')}
              variant="outline"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Baileys Docs
            </Button>
            <Button
              onClick={() => window.location.href = '/messages'}
              variant="outline"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <Play className="w-4 h-4 mr-2" />
              Test API
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-secondary-200">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 pb-4 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-600 hover:text-secondary-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  <span>Getting Started</span>
                </Card.Title>
                <Card.Description>
                  Quick start guide to using the WhatsApp API
                </Card.Description>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-secondary-900">Get your API key</h4>
                      <p className="text-sm text-secondary-600">Visit your profile to copy your API key</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-secondary-900">Create a session</h4>
                      <p className="text-sm text-secondary-600">Set up a WhatsApp session to send messages</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-secondary-900">Start sending messages</h4>
                      <p className="text-sm text-secondary-600">Use the API endpoints to send messages</p>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-success-600" />
                  <span>API Features</span>
                </Card.Title>
                <Card.Description>
                  Powerful features for WhatsApp automation
                </Card.Description>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
                    <Send className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <h4 className="font-medium text-secondary-900">Text Messages</h4>
                    <p className="text-xs text-secondary-600">Send rich text messages</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-success-50 to-success-100 rounded-lg">
                    <Image className="w-8 h-8 text-success-600 mx-auto mb-2" />
                    <h4 className="font-medium text-secondary-900">Media Files</h4>
                    <p className="text-xs text-secondary-600">Images, documents, audio</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-whatsapp-50 to-whatsapp-100 rounded-lg">
                    <Webhook className="w-8 h-8 text-whatsapp-600 mx-auto mb-2" />
                    <h4 className="font-medium text-secondary-900">Webhooks</h4>
                    <p className="text-xs text-secondary-600">Real-time notifications</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg">
                    <Settings className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
                    <h4 className="font-medium text-secondary-900">Sessions</h4>
                    <p className="text-xs text-secondary-600">Multi-device support</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Authentication Tab */}
        {activeTab === 'authentication' && (
          <div className="space-y-8">
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <span>API Authentication</span>
                </Card.Title>
                <Card.Description>
                  Secure your API requests with Bearer token authentication
                </Card.Description>
              </Card.Header>
              <Card.Body className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Base URL</h4>
                    <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
                      <code className="text-sm text-secondary-700">
                        http://localhost:3001/api
                      </code>
                      <Button
                        onClick={() => handleCopyCode('http://localhost:3001/api', 'baseUrl')}
                        variant="outline"
                        size="sm"
                        className="ml-2"
                      >
                        {copySuccess === 'baseUrl' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Your API Key</h4>
                    <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
                      <code className="text-sm text-secondary-700 break-all">
                        {maskApiKey(user?.apiKey)}
                      </code>
                      <Button
                        onClick={() => handleCopyCode(user?.apiKey || '', 'apiKey')}
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        disabled={!user?.apiKey}
                      >
                        {copySuccess === 'apiKey' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Authentication Header</h4>
                  <div className="bg-secondary-900 rounded-lg p-4">
                    <code className="text-sm text-secondary-100">
                      Authorization: Bearer {maskApiKey(user?.apiKey)}
                    </code>
                    <Button
                      onClick={() => handleCopyCode(`Authorization: Bearer ${user?.apiKey || 'your-api-key'}`, 'authHeader')}
                      variant="outline"
                      size="sm"
                      className="ml-2 bg-white/20 text-white border-white/30 hover:bg-white/30"
                    >
                      {copySuccess === 'authHeader' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <div className="space-y-8">
            {endpoints.map(({ category, icon: Icon, color, endpoints: categoryEndpoints }) => (
              <Card key={category}>
                <Card.Header>
                  <Card.Title className="flex items-center space-x-2">
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                    <span>{category}</span>
                  </Card.Title>
                  <Card.Description>
                    API endpoints for {category.toLowerCase()} operations
                  </Card.Description>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    {categoryEndpoints.map(({ method, path, description }) => (
                      <div key={path} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Badge 
                            variant={method === 'GET' ? 'success' : method === 'POST' ? 'primary' : 'secondary'}
                            className="font-mono text-xs"
                          >
                            {method}
                          </Badge>
                          <code className="text-sm text-secondary-700">{path}</code>
                        </div>
                        <span className="text-sm text-secondary-600">{description}</span>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === 'examples' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Object.entries(codeExamples).map(([language, code]) => (
                <Card key={language}>
                  <Card.Header>
                    <div className="flex items-center justify-between">
                      <Card.Title className="flex items-center space-x-2">
                        <Code className="w-5 h-5 text-primary-600" />
                        <span className="capitalize">{language}</span>
                      </Card.Title>
                      <Button
                        onClick={() => handleCopyCode(code, language)}
                        variant="outline"
                        size="sm"
                      >
                        {copySuccess === language ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div className="bg-secondary-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-secondary-100 whitespace-pre-wrap">
                        <code>{code}</code>
                      </pre>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Testing Tab */}
        {activeTab === 'testing' && (
          <div className="space-y-8">
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-primary-600" />
                  <span>Interactive Testing</span>
                </Card.Title>
                <Card.Description>
                  Test API endpoints directly from your browser
                </Card.Description>
              </Card.Header>
              <Card.Body className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Button
                    onClick={() => window.location.href = '/messages'}
                    className="flex items-center justify-center space-x-2 p-6 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                  >
                    <Send className="w-6 h-6" />
                    <span>Test Message Sending</span>
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/sessions'}
                    variant="outline"
                    className="flex items-center justify-center space-x-2 p-6"
                  >
                    <Settings className="w-6 h-6" />
                    <span>Manage Sessions</span>
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-8">
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center space-x-2">
                  <Webhook className="w-5 h-5 text-primary-600" />
                  <span>Webhook Configuration</span>
                </Card.Title>
                <Card.Description>
                  Set up real-time notifications for incoming messages
                </Card.Description>
              </Card.Header>
              <Card.Body className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Webhook Events</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-success-50 rounded-lg">
                        <h5 className="font-medium text-success-900">Message Received</h5>
                        <p className="text-sm text-success-700">Triggered when a new message arrives</p>
                      </div>
                      <div className="p-4 bg-primary-50 rounded-lg">
                        <h5 className="font-medium text-primary-900">Session Update</h5>
                        <p className="text-sm text-primary-700">Triggered when session status changes</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Webhook Payload Example</h4>
                    <div className="bg-secondary-900 rounded-lg p-4">
                      <pre className="text-sm text-secondary-100 whitespace-pre-wrap">
                        <code>{`{
  "event": "message.received",
  "sessionId": "session-123",
  "data": {
    "messageId": "msg-456",
    "from": "+1234567890",
    "text": "Hello!",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}`}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiPage; 