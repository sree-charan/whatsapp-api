import React, { useState } from 'react';
import { 
  User, 
  Key, 
  Settings, 
  Copy, 
  RefreshCw, 
  Shield, 
  Calendar,
  Mail,
  UserCircle,
  Code,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { 
  Card, 
  Badge, 
  Button,
  useToast
} from '../components/ui';

const ProfilePage = () => {
  const { user, setUser, regenerateApiKey } = useAuth();
  const { toast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyApiKey = async () => {
    if (!user?.apiKey) return;
    
    try {
      await navigator.clipboard.writeText(user.apiKey);
      setCopySuccess(true);
      toast.success('API key copied to clipboard!');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy API key:', error);
      toast.error('Failed to copy API key');
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!confirm('Are you sure you want to regenerate your API key? This will invalidate the current key.')) {
      return;
    }
    
    setIsRegenerating(true);
    try {
      const result = await regenerateApiKey();
      if (result.success) {
        toast.success('API key regenerated successfully!');
      } else {
        toast.error('Failed to regenerate API key. Please try again.');
      }
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
      toast.error('Failed to regenerate API key. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const maskApiKey = (apiKey) => {
    if (!apiKey) return 'Loading...';
    return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 8)}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 via-primary-700/95 to-primary-800/90"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
        
        <div className="relative flex items-center space-x-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <UserCircle className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-primary-100 text-lg">
              Manage your account and API configuration
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <Badge variant="success" className="bg-white/20 text-white border-white/30">
                <CheckCircle className="w-4 h-4 mr-1" />
                Account Active
              </Badge>
              <Badge variant="primary" className="bg-white/20 text-white border-white/30">
                <Shield className="w-4 h-4 mr-1" />
                API Access Enabled
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="h-fit">
            <Card.Header>
              <Card.Title className="flex items-center space-x-2">
                <User className="w-5 h-5 text-primary-600" />
                <span>Account Information</span>
              </Card.Title>
              <Card.Description>Your basic account details</Card.Description>
            </Card.Header>
            <Card.Body className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-secondary-600 mb-1">Email Address</label>
                    <p className="text-secondary-900 font-medium truncate">{user?.email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-whatsapp-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserCircle className="w-5 h-5 text-whatsapp-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-secondary-600 mb-1">Username</label>
                    <p className="text-secondary-900 font-medium truncate">{user?.username || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-success-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-secondary-600 mb-1">Member Since</label>
                    <p className="text-secondary-900 font-medium">{formatDate(user?.createdAt)}</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gradient-to-br from-secondary-50 to-white border-secondary-200">
            <Card.Header>
              <Card.Title className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-secondary-600" />
                <span>Account Status</span>
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Account Type</span>
                  <Badge variant="primary">Standard</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">API Status</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Sessions</span>
                  <span className="text-sm font-medium text-secondary-900">Unlimited</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* API Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary-200 bg-gradient-to-br from-white to-primary-50">
            <Card.Header>
              <Card.Title className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-primary-600" />
                <span>API Configuration</span>
              </Card.Title>
              <Card.Description>
                Manage your API key and access credentials
              </Card.Description>
            </Card.Header>
            <Card.Body className="space-y-6">
              {/* API Key Section */}
              <div className="bg-white rounded-xl border border-primary-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-secondary-900">Your API Key</h3>
                  <Badge variant="primary" className="flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Secure</span>
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono text-secondary-700 flex-1 break-all">
                        {user?.apiKey ? maskApiKey(user.apiKey) : 'Loading...'}
                      </code>
                      <Button
                        onClick={handleCopyApiKey}
                        variant={copySuccess ? "success" : "outline"}
                        size="sm"
                        className="ml-3 flex items-center space-x-1"
                        disabled={!user?.apiKey}
                      >
                        {copySuccess ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-secondary-600">
                      <p>Keep your API key secure and never share it publicly.</p>
                    </div>
                    <Button
                      onClick={handleRegenerateApiKey}
                      variant="primary"
                      className="flex items-center space-x-2"
                      disabled={isRegenerating}
                    >
                      <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                      <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* API Quick Access */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Code className="w-5 h-5 mr-2" />
                      API Quick Access
                    </h3>
                    <p className="text-primary-100 mb-4">
                      Your API key is ready to use. Visit our API documentation for complete guides and examples.
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-primary-200" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">API Documentation</p>
                      <p className="text-xs text-primary-100">Complete guides, examples, and interactive testing</p>
                    </div>
                    <Button
                      onClick={() => window.location.href = '/api'}
                      variant="outline"
                      className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Docs
                    </Button>
                  </div>
                  
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Test Your API</p>
                        <p className="text-xs text-primary-100">Try sending messages directly from the interface</p>
                      </div>
                      <Button
                        onClick={() => window.location.href = '/messages'}
                        variant="outline"
                        className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Test API
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Account Security */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-danger-600" />
                <span>Account Security</span>
              </Card.Title>
              <Card.Description>
                Manage your account security settings and preferences
              </Card.Description>
            </Card.Header>
            <Card.Body className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-danger-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Key className="w-5 h-5 text-danger-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-secondary-900 mb-1">Change Password</h4>
                      <p className="text-sm text-secondary-600 mb-3">Update your account password for better security</p>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Settings className="w-5 h-5 text-warning-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-secondary-900 mb-1">Two-Factor Authentication</h4>
                      <p className="text-sm text-secondary-600 mb-3">Add an extra layer of security to your account</p>
                      <Badge variant="warning">Coming Soon</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-secondary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-secondary-900 mb-1">Active Sessions</h4>
                      <p className="text-sm text-secondary-600 mb-3">Monitor and manage your active login sessions</p>
                      <Button variant="outline" size="sm">
                        View Sessions
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-success-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-secondary-900 mb-1">Login Notifications</h4>
                      <p className="text-sm text-secondary-600 mb-3">Get notified of new login attempts</p>
                      <Badge variant="success">Enabled</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Preferences */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-secondary-600" />
                <span>Preferences</span>
              </Card.Title>
              <Card.Description>
                Customize your experience and notification settings
              </Card.Description>
            </Card.Header>
            <Card.Body className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-secondary-900">Email Notifications</h4>
                    <p className="text-sm text-secondary-600">Receive updates about your account and API usage</p>
                  </div>
                  <Badge variant="success">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-secondary-900">API Usage Alerts</h4>
                    <p className="text-sm text-secondary-600">Get notified when approaching rate limits</p>
                  </div>
                  <Badge variant="success">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-secondary-900">Marketing Communications</h4>
                    <p className="text-sm text-secondary-600">Product updates and promotional content</p>
                  </div>
                  <Badge variant="secondary">Disabled</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 