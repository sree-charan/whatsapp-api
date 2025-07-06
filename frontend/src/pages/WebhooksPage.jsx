import React, { useState, useEffect } from 'react';
import { 
  Webhook, Settings, BarChart3, Send, CheckCircle, XCircle, AlertCircle, 
  RefreshCw, Globe, Code, Bell, Shield, Zap, Clock, Target, Link, 
  Database, Activity, TrendingUp, Filter, Calendar, Eye, Copy, 
  Play, RotateCcw, Server, MonitorSpeaker, FileText, Hash 
} from 'lucide-react';
import { webhooksAPI, sessionsAPI, handleApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const WebhooksPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('config');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Webhook configuration state
  const [webhookConfig, setWebhookConfig] = useState({
    url: '',
    secret: '',
    events: {
      'message.received': true,
      'message.sent': true,
      'message.delivered': true,
      'message.read': true,
      'session.connected': true,
      'session.disconnected': true,
      'contact.added': true,
      'group.created': true,
      'group.updated': true,
      'group.participant.added': true,
      'group.participant.removed': true
    },
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000
  });

  // Test webhook state
  const [testWebhook, setTestWebhook] = useState({
    url: '',
    method: 'POST',
    headers: {},
    body: '',
    response: null,
    loading: false
  });

  // Webhook logs state
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [logFilters, setLogFilters] = useState({
    event: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load webhook config when session changes
  useEffect(() => {
    if (selectedSession) {
      loadWebhookConfig();
    }
  }, [selectedSession]);

  // Load webhook logs when session changes or filters change
  useEffect(() => {
    if (selectedSession && activeTab === 'logs') {
      loadWebhookLogs();
    }
  }, [selectedSession, activeTab, logFilters]);

  const loadSessions = async () => {
    try {
      const response = await sessionsAPI.list();
      setSessions(response.data.sessions || []);
      if (response.data.sessions?.length > 0) {
        setSelectedSession(response.data.sessions[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadWebhookConfig = async () => {
    if (!selectedSession) return;
    
    setLoading(true);
    try {
      const response = await webhooksAPI.getConfig(selectedSession);
      if (response.data.success && response.data.config) {
        setWebhookConfig(prev => ({
          ...prev,
          ...response.data.config
        }));
      }
    } catch (error) {
      handleApiError(error, 'Failed to load webhook configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookLogs = async () => {
    if (!selectedSession) return;
    
    setLoading(true);
    try {
      const response = await webhooksAPI.getStats(selectedSession);
      setWebhookLogs(response.data.logs || []);
    } catch (error) {
      handleApiError(error, 'Failed to load webhook logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebhookConfig = async (e) => {
    e.preventDefault();
    if (!selectedSession) {
      alert('Please select a session first');
      return;
    }

    setSaving(true);
    try {
      const response = await webhooksAPI.updateConfig(selectedSession, webhookConfig);
      if (response.data.success) {
        alert('Webhook configuration saved successfully!');
      }
    } catch (error) {
      handleApiError(error, 'Failed to save webhook configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async (e) => {
    e.preventDefault();
    
    setTestWebhook(prev => ({ ...prev, loading: true, response: null }));
    try {
      const response = await webhooksAPI.test({
        url: testWebhook.url,
        method: testWebhook.method,
        headers: testWebhook.headers,
        body: testWebhook.body
      });
      
      setTestWebhook(prev => ({
        ...prev,
        response: response.data
      }));
    } catch (error) {
      setTestWebhook(prev => ({
        ...prev,
        response: {
          success: false,
          error: error.response?.data?.error || error.message
        }
      }));
    } finally {
      setTestWebhook(prev => ({ ...prev, loading: false }));
    }
  };

  const handleEventToggle = (event) => {
    setWebhookConfig(prev => ({
      ...prev,
      events: {
        ...prev.events,
        [event]: !prev.events[event]
      }
    }));
  };

  const addTestHeader = () => {
    const key = prompt('Header name:');
    if (key) {
      const value = prompt('Header value:');
      if (value) {
        setTestWebhook(prev => ({
          ...prev,
          headers: {
            ...prev.headers,
            [key]: value
          }
        }));
      }
    }
  };

  const removeTestHeader = (key) => {
    setTestWebhook(prev => ({
      ...prev,
      headers: Object.fromEntries(
        Object.entries(prev.headers).filter(([k]) => k !== key)
      )
    }));
  };

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setWebhookConfig(prev => ({ ...prev, secret }));
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'failed':
        return <XCircle className="text-red-500" size={16} />;
      case 'pending':
        return <RefreshCw className="text-yellow-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  const renderConfigTab = () => (
    <div className="space-y-6">
      {/* Session Selection Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Session Selection</h2>
              <p className="text-sm text-gray-600">Choose which session to configure webhooks for</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedSession === session.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    session.status === 'connected' ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    <MonitorSpeaker className={`w-4 h-4 ${
                      session.status === 'connected' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{session.phoneNumber || 'No Phone'}</p>
                    <p className="text-sm text-gray-500">Session {session.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  session.status === 'connected' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {session.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Configuration Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Webhook Configuration</h2>
              <p className="text-sm text-gray-600">Configure webhook URL and delivery settings</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveWebhookConfig} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={webhookConfig.url}
                  onChange={(e) => setWebhookConfig(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://your-server.com/webhook"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key
                <button
                  type="button"
                  onClick={generateSecret}
                  className="ml-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Generate
                </button>
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={webhookConfig.secret}
                  onChange={(e) => setWebhookConfig(prev => ({ ...prev, secret: e.target.value }))}
                  placeholder="Secret key for webhook verification"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Events to Subscribe</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(webhookConfig.events).map(([event, enabled]) => (
                <label key={event} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => handleEventToggle(event)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{event}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Retry Attempts</label>
              <div className="relative">
                <RotateCcw className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={webhookConfig.retryAttempts}
                  onChange={(e) => setWebhookConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Retry Delay (ms)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="100"
                  max="10000"
                  value={webhookConfig.retryDelay}
                  onChange={(e) => setWebhookConfig(prev => ({ ...prev, retryDelay: parseInt(e.target.value) }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeout (ms)</label>
              <div className="relative">
                <Zap className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="1000"
                  max="120000"
                  value={webhookConfig.timeout}
                  onChange={(e) => setWebhookConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !selectedSession}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {saving ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Configuration...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Save Configuration</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const renderTestTab = () => (
    <div className="space-y-6">
      {/* Test Configuration Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Send className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Test Webhook</h2>
              <p className="text-sm text-gray-600">Send test requests to your webhook endpoints</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-blue-50 rounded-full">
              <span className="text-xs font-medium text-blue-600">Live Testing</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleTestWebhook} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={testWebhook.url}
                  onChange={(e) => setTestWebhook(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://your-server.com/webhook"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
              <div className="relative">
                <Code className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <select
                  value={testWebhook.method}
                  onChange={(e) => setTestWebhook(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Request Headers</label>
              <button
                type="button"
                onClick={addTestHeader}
                className="flex items-center space-x-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Hash className="w-4 h-4" />
                <span>Add Header</span>
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(testWebhook.headers).map(([key, value]) => (
                <div key={key} className="flex gap-3">
                  <input
                    type="text"
                    value={key}
                    readOnly
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setTestWebhook(prev => ({
                      ...prev,
                      headers: { ...prev.headers, [key]: e.target.value }
                    }))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeTestHeader(key)}
                    className="px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Request Body (JSON)</label>
            <textarea
              value={testWebhook.body}
              onChange={(e) => setTestWebhook(prev => ({ ...prev, body: e.target.value }))}
              placeholder='{"event": "test", "data": {"message": "Hello World"}}'
              rows="8"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={testWebhook.loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 px-6 rounded-lg font-medium hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {testWebhook.loading ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Testing Webhook...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Play className="w-4 h-4" />
                <span>Test Webhook</span>
              </div>
            )}
          </button>
        </form>
      </div>

      {/* Response Card */}
      {testWebhook.response && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                testWebhook.response.success ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {testWebhook.response.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Response</h3>
                <p className="text-sm text-gray-600">
                  {testWebhook.response.success ? 'Test successful' : 'Test failed'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(testWebhook.response, null, 2))}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm overflow-x-auto text-gray-700">
              {JSON.stringify(testWebhook.response, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  const renderLogsTab = () => (
    <div className="space-y-6">
      {/* Filters Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Filter className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
              <p className="text-sm text-gray-600">Filter webhook logs by session, event, status, and date</p>
            </div>
          </div>
          <button
            onClick={() => setLogFilters({
              event: 'all',
              status: 'all',
              startDate: '',
              endDate: '',
              page: 1,
              limit: 20
            })}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
            <div className="relative">
              <Server className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">All Sessions</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.phoneNumber || `Session ${session.id.slice(0, 8)}...`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <div className="relative">
              <Bell className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <select
                value={logFilters.event}
                onChange={(e) => setLogFilters(prev => ({ ...prev, event: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="all">All Events</option>
                <option value="message.received">Message Received</option>
                <option value="message.sent">Message Sent</option>
                <option value="message.delivered">Message Delivered</option>
                <option value="message.read">Message Read</option>
                <option value="session.connected">Session Connected</option>
                <option value="session.disconnected">Session Disconnected</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="relative">
              <Target className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <select
                value={logFilters.status}
                onChange={(e) => setLogFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={logFilters.startDate}
                onChange={(e) => setLogFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logs Display Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Webhook Logs</h2>
              <p className="text-sm text-gray-600">Real-time webhook delivery logs and responses</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadWebhookLogs}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading webhook logs...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhookLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">No webhook logs found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              webhookLogs.map((log, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <span className="font-medium text-gray-900">{log.event}</span>
                        <div className="text-sm text-gray-500 mt-1">
                          <Globe className="w-3 h-3 inline mr-1" />
                          {log.webhookUrl}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.responseStatus >= 200 && log.responseStatus < 300
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {log.responseStatus}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.duration}ms
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {log.attempts > 1 && (
                    <div className="flex items-center space-x-1 mb-2">
                      <RotateCcw className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-600">
                        {log.attempts} attempts
                      </span>
                    </div>
                  )}
                  
                  {log.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Error:</span>
                      </div>
                      <p className="mt-1">{log.error}</p>
                    </div>
                  )}
                  
                  {log.payload && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700 flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>View Payload</span>
                      </summary>
                      <div className="mt-2 bg-gray-50 rounded-lg p-3">
                        <pre className="text-xs overflow-x-auto text-gray-700">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Webhook className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Webhooks</h1>
                <p className="text-gray-600 mt-1">Configure webhooks, test endpoints, and monitor delivery</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  {sessions.filter(s => s.status === 'connected').length} Active
                </span>
              </div>
              <button 
                onClick={loadSessions}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Webhooks</p>
                <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Link className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600">{sessions.filter(s => s.status === 'connected').length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold text-purple-600">98.5%</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-amber-600">250ms</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'config' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Settings size={16} />
              <span>Configuration</span>
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'test' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Send size={16} />
              <span>Test Webhook</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'logs' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BarChart3 size={16} />
              <span>Logs & Monitoring</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'config' && renderConfigTab()}
        {activeTab === 'test' && renderTestTab()}
        {activeTab === 'logs' && renderLogsTab()}
      </div>
    </div>
  );
};

export default WebhooksPage;
