import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Smartphone, ArrowLeft, Power, RotateCcw, Trash2, QrCode, 
  CheckCircle, XCircle, AlertCircle, Clock, Wifi, WifiOff,
  MessageCircle, Send, Download, Upload, Users, BarChart3,
  Settings, Shield, Globe, Activity, Phone, Calendar,
  Zap, Target, Link, Eye, Copy, RefreshCw, MonitorSpeaker,
  Signal, SignalHigh, SignalLow, SignalMedium, Loader, Plus
} from 'lucide-react';
import { sessionsAPI, messagesAPI, webhooksAPI, handleApiError } from '../services/api';
import { Badge } from '../components/ui';

const SessionDetailPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [session, setSession] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [qrCode, setQRCode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [webhookConfig, setWebhookConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [webhooksLoading, setWebhooksLoading] = useState(false);
  
  // Auto-refresh interval
  const [refreshInterval, setRefreshInterval] = useState(null);
  // Rate limiting refs
  const lastFetchTime = useRef(0);
  const fetchInProgress = useRef(false);

  const loadSessionData = useCallback(async (force = false) => {
    // Rate limiting: minimum 3 seconds between calls unless forced
    const now = Date.now();
    if (!force && fetchInProgress.current) {
      console.log('SessionDetail fetch already in progress, skipping...');
      return;
    }
    
    if (!force && (now - lastFetchTime.current) < 3000) {
      console.log('SessionDetail rate limiting: Too soon since last fetch, skipping...');
      return;
    }

    try {
      fetchInProgress.current = true;
      lastFetchTime.current = now;
      
      const [sessionRes, statusRes] = await Promise.all([
        sessionsAPI.get(sessionId),
        sessionsAPI.getStatus(sessionId)
      ]);
      
      setSession(sessionRes.data.session);
      setSessionStatus(statusRes.data);
      
      // Load additional data based on session status
      if (statusRes.data.status === 'qr_generated') {
        loadQRCode();
      }
      
      // Always try to load messages and webhook config regardless of status
      // as there might be historical data
      loadRecentMessages();
      loadWebhookConfig();
      
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [sessionId]);

  useEffect(() => {
    loadSessionData(true); // Force initial load
  }, [loadSessionData]);

  useEffect(() => {
    // Set up auto-refresh every 10 seconds with rate limiting
    console.log('Setting up session detail polling interval');
    const interval = setInterval(() => {
      loadSessionData(); // Respects rate limiting
    }, 10000);
    setRefreshInterval(interval);
    
    return () => {
      console.log('Cleaning up session detail polling interval');
      if (interval) clearInterval(interval);
    };
  }, [loadSessionData]);

  const loadQRCode = async () => {
    try {
      const response = await sessionsAPI.getQR(sessionId);
      setQRCode(response.data.qrCode);
    } catch (error) {
      console.error('Error loading QR code:', error);
    }
  };

  const loadRecentMessages = async () => {
    setMessagesLoading(true);
    try {
      console.log('Loading messages for session:', sessionId);
      const response = await messagesAPI.getHistory(sessionId, { limit: 20 });
      console.log('Messages response:', response.data);
      
      // Handle different possible response structures
      const messagesData = response.data.messages || response.data.data || response.data || [];
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (error) {
      console.error('Error loading messages:', error);
      console.error('Messages error details:', error.response?.data || error.message);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadWebhookConfig = async () => {
    setWebhooksLoading(true);
    try {
      console.log('Loading webhook config for session:', sessionId);
      const response = await webhooksAPI.getConfig(sessionId);
      console.log('Webhook config response:', response.data);
      
      // Handle different possible response structures
      const configData = response.data.config || response.data.data || response.data || null;
      setWebhookConfig(configData);
    } catch (error) {
      console.error('Error loading webhook config:', error);
      console.error('Webhook error details:', error.response?.data || error.message);
      setWebhookConfig(null);
    } finally {
      setWebhooksLoading(false);
    }
  };

  const handleSessionAction = async (action) => {
    setActionLoading(action);
    try {
      let response;
      switch (action) {
        case 'start':
          response = await sessionsAPI.start(sessionId);
          break;
        case 'stop':
          response = await sessionsAPI.stop(sessionId);
          break;
        case 'restart':
          response = await sessionsAPI.restart(sessionId);
          break;
        case 'clearAuth':
          response = await sessionsAPI.clearAuth(sessionId);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
            response = await sessionsAPI.delete(sessionId);
            navigate('/sessions');
            return;
          }
          break;
        default:
          return;
      }
      
      if (response?.data) {
        // Show success message
        console.log(`${action} successful:`, response.data.message);
        // Refresh data immediately
        setTimeout(loadSessionData, 1000);
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
      alert(`Failed to ${action} session: ${handleApiError(error)}`);
    } finally {
      setActionLoading('');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'connecting':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'qr_generated':
        return <QrCode className="w-5 h-5 text-blue-500" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'qr_generated':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'disconnected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatUptime = (createdAt) => {
    if (!createdAt) return 'Unknown';
    const uptime = Date.now() - new Date(createdAt).getTime();
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-4">The session you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => navigate('/sessions')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/sessions')}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Session Details</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-gray-600">
                    {session.phoneNumber || 'No Phone Number'}
                  </p>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(sessionStatus?.status)}`}>
                    {getStatusIcon(sessionStatus?.status)}
                    <span className="capitalize">{sessionStatus?.status || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={loadSessionData}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                {sessionStatus?.status === 'disconnected' && (
                  <button
                    onClick={() => handleSessionAction('start')}
                    disabled={actionLoading === 'start'}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === 'start' ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                    <span>Start</span>
                  </button>
                )}
                
                {['connected', 'connecting', 'qr_generated'].includes(sessionStatus?.status) && (
                  <>
                    <button
                      onClick={() => handleSessionAction('restart')}
                      disabled={actionLoading === 'restart'}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === 'restart' ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      <span>Restart</span>
                    </button>
                    
                    <button
                      onClick={() => handleSessionAction('stop')}
                      disabled={actionLoading === 'stop'}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === 'stop' ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                      <span>Stop</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'connection', label: 'Connection', icon: Wifi },
              { id: 'messages', label: 'Messages', icon: MessageCircle },
              { id: 'webhooks', label: 'Webhooks', icon: Globe },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className={`text-2xl font-bold capitalize ${
                      sessionStatus?.status === 'connected' ? 'text-green-600' : 
                      sessionStatus?.status === 'connecting' ? 'text-yellow-600' :
                      sessionStatus?.status === 'qr_generated' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {sessionStatus?.status || 'Unknown'}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    {getStatusIcon(sessionStatus?.status)}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Messages</p>
                    <p className="text-2xl font-bold text-gray-900">{sessionStatus?.stats?.messagesSent || 0}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <Send className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Uptime</p>
                    <p className="text-2xl font-bold text-gray-900">{formatUptime(session.createdAt)}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Retries</p>
                    <p className="text-2xl font-bold text-gray-900">{sessionStatus?.connectionRetries || 0}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <RotateCcw className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Session Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <MonitorSpeaker className="w-5 h-5 text-blue-600" />
                  <span>Session Information</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Session ID</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{sessionId}</code>
                      <button
                        onClick={() => copyToClipboard(sessionId)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Phone Number</span>
                    <span className="text-sm text-gray-900">{session.phoneNumber || 'Not connected'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Created</span>
                    <span className="text-sm text-gray-900">{new Date(session.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Last Seen</span>
                    <span className="text-sm text-gray-900">
                      {sessionStatus?.lastSeenAt ? new Date(sessionStatus.lastSeenAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">WhatsApp ID</span>
                    <span className="text-sm text-gray-900">
                      {sessionStatus?.whatsapp?.whatsappId || 'Not available'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connection Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Signal className="w-5 h-5 text-green-600" />
                  <span>Connection Details</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Connection Status</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(sessionStatus?.status)}
                      <span className="text-sm text-gray-900 capitalize">{sessionStatus?.status}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Is Active</span>
                    <span className="text-sm text-gray-900">{sessionStatus?.isActive ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Is Connected</span>
                    <span className="text-sm text-gray-900">{sessionStatus?.isConnected ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Connection Retries</span>
                    <span className="text-sm text-gray-900">{sessionStatus?.connectionRetries || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Has QR Code</span>
                    <span className="text-sm text-gray-900">
                      {sessionStatus?.whatsapp?.hasQRCode ? 'Available' : 'Not available'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tab contents would go here - Connection, Messages, Webhooks, Settings */}
        {activeTab === 'connection' && (
          <div className="space-y-6">
            {/* QR Code Section */}
            {sessionStatus?.status === 'qr_generated' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <QrCode className="w-5 h-5 text-blue-600" />
                  <span>QR Code</span>
                </h3>
                <div className="text-center">
                  {qrCode ? (
                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                      <img 
                        src={`data:image/png;base64,${qrCode}`} 
                        alt="WhatsApp QR Code"
                        className="w-64 h-64 mx-auto"
                      />
                      <p className="text-sm text-gray-600 mt-4">
                        Scan this QR code with WhatsApp to connect
                      </p>
                    </div>
                  ) : (
                    <div className="py-12">
                      <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                      <p className="text-gray-600">Loading QR Code...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Connection Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-purple-600" />
                <span>Connection Management</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => handleSessionAction('restart')}
                  disabled={actionLoading === 'restart'}
                  className="flex items-center justify-center space-x-2 p-4 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'restart' ? (
                    <Loader className="w-5 h-5 animate-spin text-blue-600" />
                  ) : (
                    <RotateCcw className="w-5 h-5 text-blue-600" />
                  )}
                  <span className="font-medium text-blue-700">Restart Session</span>
                </button>

                <button
                  onClick={() => handleSessionAction('clearAuth')}
                  disabled={actionLoading === 'clearAuth'}
                  className="flex items-center justify-center space-x-2 p-4 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'clearAuth' ? (
                    <Loader className="w-5 h-5 animate-spin text-orange-600" />
                  ) : (
                    <Shield className="w-5 h-5 text-orange-600" />
                  )}
                  <span className="font-medium text-orange-700">Clear Auth</span>
                </button>

                <button
                  onClick={loadQRCode}
                  className="flex items-center justify-center space-x-2 p-4 border border-green-200 rounded-xl hover:bg-green-50 transition-colors"
                >
                  <QrCode className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">Refresh QR</span>
                </button>

                <button
                  onClick={() => handleSessionAction('delete')}
                  disabled={actionLoading === 'delete'}
                  className="flex items-center justify-center space-x-2 p-4 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'delete' ? (
                    <Loader className="w-5 h-5 animate-spin text-red-600" />
                  ) : (
                    <Trash2 className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium text-red-700">Delete Session</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Messages Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span>Message History</span>
                </h3>
                <button
                  onClick={loadRecentMessages}
                  disabled={messagesLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${messagesLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {messagesLoading ? (
                <div className="text-center py-8">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-green-500" />
                  <p className="text-gray-600">Loading messages...</p>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((message, index) => (
                    <div key={message.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            message.fromMe ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                          <span className="font-medium text-gray-900">
                            {message.fromMe ? 'You' : (message.pushName || message.from || 'Unknown')}
                          </span>
                          {message.messageType && (
                            <Badge variant="secondary" className="text-xs">
                              {message.messageType}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {message.timestamp ? new Date(message.timestamp * 1000).toLocaleString() : 'Unknown time'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {message.body && (
                          <p className="text-gray-700">{message.body}</p>
                        )}
                        {message.caption && (
                          <p className="text-gray-600 italic">Caption: {message.caption}</p>
                        )}
                        {!message.body && !message.caption && (
                          <p className="text-gray-500 italic">
                            {message.messageType || 'Media'} message
                          </p>
                        )}
                        {message.quotedMessage && (
                          <div className="bg-gray-100 border-l-4 border-gray-400 pl-3 py-2 text-sm">
                            <p className="text-gray-600">Replied to: {message.quotedMessage.body || 'Message'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No messages found</p>
                  <p className="text-sm text-gray-500 mt-2">Send some messages to see them here</p>
                </div>
              )}
            </div>

            {/* Message Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Messages</p>
                    <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sent by You</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {messages.filter(m => m.fromMe).length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <Send className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Received</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {messages.filter(m => !m.fromMe).length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <Download className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            {/* Webhook Configuration */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <span>Webhook Configuration</span>
                </h3>
                <button
                  onClick={loadWebhookConfig}
                  disabled={webhooksLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${webhooksLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {webhooksLoading ? (
                <div className="text-center py-8">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
                  <p className="text-gray-600">Loading webhook configuration...</p>
                </div>
              ) : webhookConfig ? (
                <div className="space-y-6">
                  {/* Webhook Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${webhookConfig.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium text-gray-900">
                        Webhook Status: {webhookConfig.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <Badge variant={webhookConfig.enabled ? 'success' : 'danger'}>
                      {webhookConfig.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Webhook Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Configuration Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Webhook URL</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                              {webhookConfig.url || 'Not configured'}
                            </span>
                            {webhookConfig.url && (
                              <button
                                onClick={() => copyToClipboard(webhookConfig.url)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Copy className="w-4 h-4 text-gray-500" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Authentication</span>
                          <span className="text-sm text-gray-900">
                            {webhookConfig.secret ? 'HMAC Secret Configured' : 'No Authentication'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Retry Attempts</span>
                          <span className="text-sm text-gray-900">{webhookConfig.retryAttempts || 3}</span>
                        </div>

                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-gray-600">Timeout</span>
                          <span className="text-sm text-gray-900">{webhookConfig.timeout || 30}s</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Subscribed Events</h4>
                      <div className="space-y-2">
                        {webhookConfig.events && Object.keys(webhookConfig.events).length > 0 ? (
                          Object.entries(webhookConfig.events).map(([event, enabled]) => (
                            <div key={event} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-700 capitalize">{event.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <Badge variant={enabled ? 'success' : 'secondary'} className="text-xs">
                                {enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No events configured</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                      <Zap className="w-4 h-4" />
                      <span>Test Webhook</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      <Settings className="w-4 h-4" />
                      <span>Configure</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                      <Activity className="w-4 h-4" />
                      <span>View Logs</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No webhook configuration found</p>
                  <p className="text-sm text-gray-500 mt-2">Configure webhooks to receive real-time notifications</p>
                  <button className="mt-4 flex items-center space-x-2 mx-auto px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Setup Webhook</span>
                  </button>
                </div>
              )}
            </div>

            {/* Webhook Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {webhookConfig?.stats?.totalRequests || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Successful</p>
                    <p className="text-2xl font-bold text-green-600">
                      {webhookConfig?.stats?.successfulRequests || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">
                      {webhookConfig?.stats?.failedRequests || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {webhookConfig?.stats?.averageResponseTime || 0}ms
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Session Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-600" />
                <span>Session Settings</span>
              </h3>

              <div className="space-y-6">
                {/* Basic Settings */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Basic Configuration</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Name
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={`Session ${sessionId.substring(0, 8)}`}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter session name"
                          />
                          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                            Save
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Enter session description"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auto-Reconnect
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="autoReconnect"
                            defaultChecked={true}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="autoReconnect" className="text-sm text-gray-700">
                            Automatically reconnect when disconnected
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Presence Updates
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="presenceUpdates"
                            defaultChecked={false}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="presenceUpdates" className="text-sm text-gray-700">
                            Send online/offline status updates
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Read Receipts
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="readReceipts"
                            defaultChecked={true}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="readReceipts" className="text-sm text-gray-700">
                            Send read receipts for incoming messages
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Advanced Configuration</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message History Sync
                        </label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="full">Full History</option>
                          <option value="recent">Recent Messages Only</option>
                          <option value="none">No Sync</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Reconnection Attempts
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          defaultValue="5"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Connection Timeout (seconds)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="300"
                          defaultValue="60"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          QR Code Refresh Interval (seconds)
                        </label>
                        <input
                          type="number"
                          min="30"
                          max="300"
                          defaultValue="60"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-end space-x-3">
                    <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Reset to Defaults
                    </button>
                    <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Session Information</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium text-gray-600">Session ID</span>
                    <span className="text-sm text-gray-900 font-mono">{sessionId}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium text-gray-600">Created At</span>
                    <span className="text-sm text-gray-900">
                      {session?.createdAt ? new Date(session.createdAt).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium text-gray-600">Last Update</span>
                    <span className="text-sm text-gray-900">
                      {session?.updatedAt ? new Date(session.updatedAt).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium text-gray-600">Phone Number</span>
                    <span className="text-sm text-gray-900">{session?.phoneNumber || 'Not connected'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium text-gray-600">Connection Status</span>
                    <span className="text-sm text-gray-900 capitalize">{sessionStatus?.status || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium text-gray-600">Platform</span>
                    <span className="text-sm text-gray-900">WhatsApp Web</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Danger Zone</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-900">Clear Authentication State</h4>
                    <p className="text-sm text-red-700">Remove saved authentication and force fresh QR generation</p>
                  </div>
                  <button
                    onClick={() => handleSessionAction('clearAuth')}
                    disabled={actionLoading === 'clearAuth'}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === 'clearAuth' ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      'Clear Auth'
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-900">Delete Session</h4>
                    <p className="text-sm text-red-700">Permanently delete this session and all associated data</p>
                  </div>
                  <button
                    onClick={() => handleSessionAction('delete')}
                    disabled={actionLoading === 'delete'}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === 'delete' ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      'Delete Session'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetailPage; 