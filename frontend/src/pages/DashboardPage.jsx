import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  TrendingUp, 
  Activity,
  Smartphone,
  Send,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  ArrowUp,
  ArrowDown,
  ExternalLink
} from 'lucide-react';
import { statusAPI, sessionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Card, 
  Badge, 
  LoadingOverlay,
  SkeletonCard,
  Progress,
  useToast
} from '../components/ui';

const DashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Rate limiting refs
  const lastFetchTime = useRef(0);
  const fetchInProgress = useRef(false);

  const loadDashboardData = useCallback(async (force = false) => {
    // Rate limiting: minimum 5 seconds between calls unless forced
    const now = Date.now();
    if (!force && fetchInProgress.current) {
      console.log('Dashboard fetch already in progress, skipping...');
      return;
    }
    
    if (!force && (now - lastFetchTime.current) < 5000) {
      console.log('Dashboard rate limiting: Too soon since last fetch, skipping...');
      return;
    }

    try {
      fetchInProgress.current = true;
      lastFetchTime.current = now;
      
      const [statsResponse, sessionsResponse] = await Promise.all([
        statusAPI.stats(),
        sessionsAPI.list()
      ]);
      
      console.log('Dashboard: Stats response:', statsResponse.data);
      console.log('Dashboard: Sessions response:', sessionsResponse.data);
      
      // Process and enhance stats data
      const rawStats = statsResponse.data;
      const sessionsData = sessionsResponse.data.sessions || [];
      
      // Calculate additional statistics
      const enhancedStats = {
        ...rawStats,
        // Calculate total messages and success rate
        messages: {
          ...rawStats.messages,
          total: (rawStats.messages?.sent || 0) + (rawStats.messages?.received || 0),
          success: rawStats.messages?.sent || 0,
          failed: rawStats.messages?.webhooksFailed || 0,
          successRate: (rawStats.messages?.sent || 0) > 0 
            ? ((rawStats.messages?.sent || 0) / ((rawStats.messages?.sent || 0) + (rawStats.messages?.webhooksFailed || 0))) * 100
            : 0
        },
        // Calculate session statistics from actual sessions data
        sessions: {
          ...rawStats.sessions,
          // Use actual session counts from sessions response
          actualActive: sessionsData.filter(s => s.status === 'connected').length,
          actualConnecting: sessionsData.filter(s => s.status === 'connecting').length,
          actualDisconnected: sessionsData.filter(s => s.status === 'disconnected').length,
          actualInactive: sessionsData.filter(s => s.status === 'inactive').length,
          actualQrGenerated: sessionsData.filter(s => s.status === 'qr_generated').length,
          actualTotal: sessionsData.length
        }
      };
      
      setStats(enhancedStats);
      setSessions(sessionsData);
      setError(null);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
      console.error('Dashboard error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    loadDashboardData(true); // Force initial load
  }, [loadDashboardData]);

  useEffect(() => {
    // Set up polling with rate limiting
    console.log('Setting up dashboard polling interval');
    const interval = setInterval(() => {
      loadDashboardData(); // Respects rate limiting
    }, 30000);

    return () => {
      console.log('Cleaning up dashboard polling interval');
      clearInterval(interval);
    };
  }, [loadDashboardData]);

  // Quick Actions handlers
  const handleSendMessage = () => {
    navigate('/messages');
  };

  const handleNewSession = () => {
    navigate('/sessions');
  };

  const handleViewAnalytics = () => {
    toast.success('Analytics feature coming soon!');
  };

  const handleScheduleMessage = () => {
    toast.info('Schedule message feature coming soon!');
  };

  const getSessionStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'disconnected': return 'danger';
      default: return 'secondary';
    }
  };

  const getSessionStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'connecting': return <Activity className="w-4 h-4" />;
      case 'disconnected': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatUptime = (uptime) => {
    if (!uptime && uptime !== 0) return 'N/A';
    
    // Handle uptime in seconds
    const totalSeconds = Math.floor(uptime);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const StatCard = ({ title, value, icon, change, changeType, description, color = 'primary' }) => (
    <Card hover gradient className="h-full">
      <Card.Body>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-secondary-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-secondary-900 mb-2">{formatNumber(value)}</p>
            {change !== undefined && (
              <div className={`flex items-center text-sm ${changeType === 'increase' ? 'text-success-600' : 'text-danger-600'}`}>
                {changeType === 'increase' ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                <span>{change}% from last week</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-secondary-500 mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-${color}-100`}>
            <div className={`text-${color}-600`}>
              {icon}
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const SessionCard = ({ session }) => (
    <Link to={`/sessions/${session.id}`} className="block">
      <Card hover className="h-full group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-purple-200">
        <Card.Body className="flex items-center justify-between min-w-0">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-whatsapp-500 to-whatsapp-600 rounded-xl flex items-center justify-center shadow-medium">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-secondary-900 truncate">
                Session {session.id.slice(0, 8)}...
              </p>
              <p className="text-xs text-secondary-500 truncate">
                {session.phoneNumber || 'Not connected'}
              </p>
              <p className="text-xs text-secondary-500 truncate">
                Created: {new Date(session.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge 
              variant={getSessionStatusColor(session.status)}
              className="flex items-center space-x-1 whitespace-nowrap"
            >
              {getSessionStatusIcon(session.status)}
              <span className="capitalize text-xs">{session.status}</span>
            </Badge>
            <ExternalLink className="w-4 h-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        </Card.Body>
      </Card>
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Something went wrong</h3>
          <p className="text-secondary-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Welcome back, {user?.username}!</h1>
          <p className="text-secondary-600 mt-1">Here's what's happening with your WhatsApp API today.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Badge variant="primary" size="lg" className="font-medium">
            <Activity className="w-4 h-4 mr-2" />
            System Online
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Messages"
          value={stats?.messages?.total || 0}
          icon={<MessageSquare className="w-6 h-6" />}
          change={stats?.messages?.sent > 0 ? 12 : 0}
          changeType="increase"
          description={`${stats?.messages?.sent || 0} sent, ${stats?.messages?.received || 0} received`}
          color="primary"
        />
        <StatCard
          title="Active Sessions"
          value={stats?.sessions?.actualActive || 0}
          icon={<Users className="w-6 h-6" />}
          change={stats?.sessions?.actualActive > 0 ? 5 : 0}
          changeType="increase"
          description={`${stats?.sessions?.actualTotal || 0} total sessions`}
          color="whatsapp"
        />
        <StatCard
          title="Success Rate"
          value={`${Math.round(stats?.messages?.successRate || 0)}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          change={stats?.messages?.successRate > 90 ? 3 : -2}
          changeType={stats?.messages?.successRate > 90 ? "increase" : "decrease"}
          description="Message delivery rate"
          color="success"
        />
        <StatCard
          title="System Uptime"
          value={formatUptime(stats?.uptime)}
          icon={<Clock className="w-6 h-6" />}
          description={`${stats?.sessions?.actualTotal || 0} sessions running`}
          color="secondary"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Activity */}
        <Card>
          <Card.Header>
            <Card.Title>Message Activity</Card.Title>
            <Card.Description>Recent messaging statistics</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Messages Sent</span>
                <span className="text-sm font-semibold text-secondary-900">{stats?.messages?.sent || 0}</span>
              </div>
              <Progress 
                value={stats?.messages?.sent || 0} 
                max={Math.max(stats?.messages?.total || 1, 1)} 
                variant="success"
                showLabel
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Messages Received</span>
                <span className="text-sm font-semibold text-secondary-900">{stats?.messages?.received || 0}</span>
              </div>
              <Progress 
                value={stats?.messages?.received || 0} 
                max={Math.max(stats?.messages?.total || 1, 1)} 
                variant="primary"
                showLabel
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Webhook Failures</span>
                <span className="text-sm font-semibold text-secondary-900">{stats?.messages?.webhooksFailed || 0}</span>
              </div>
              <Progress 
                value={stats?.messages?.webhooksFailed || 0} 
                max={Math.max(stats?.messages?.webhooksSent + stats?.messages?.webhooksFailed || 1, 1)} 
                variant="danger"
                showLabel
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Success Rate</span>
                <span className="text-sm font-semibold text-secondary-900">{Math.round(stats?.messages?.successRate || 0)}%</span>
              </div>
              <Progress 
                value={stats?.messages?.successRate || 0} 
                max={100} 
                variant={stats?.messages?.successRate > 90 ? "success" : stats?.messages?.successRate > 70 ? "warning" : "danger"}
                showLabel
              />
            </div>
          </Card.Body>
        </Card>

        {/* Session Status Breakdown */}
        <Card>
          <Card.Header>
            <Card.Title>Session Status</Card.Title>
            <Card.Description>Current status of all sessions</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              {/* Connected Sessions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-secondary-600">Connected</span>
                </div>
                <span className="text-sm font-semibold text-secondary-900">{stats?.sessions?.actualActive || 0}</span>
              </div>
              <Progress 
                value={stats?.sessions?.actualActive || 0} 
                max={Math.max(stats?.sessions?.actualTotal || 1, 1)} 
                variant="success"
                showLabel
              />
              
              {/* Connecting Sessions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-secondary-600">Connecting</span>
                </div>
                <span className="text-sm font-semibold text-secondary-900">{stats?.sessions?.actualConnecting || 0}</span>
              </div>
              <Progress 
                value={stats?.sessions?.actualConnecting || 0} 
                max={Math.max(stats?.sessions?.actualTotal || 1, 1)} 
                variant="warning"
                showLabel
              />
              
              {/* QR Code Generated */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-secondary-600">QR Ready</span>
                </div>
                <span className="text-sm font-semibold text-secondary-900">{stats?.sessions?.actualQrGenerated || 0}</span>
              </div>
              <Progress 
                value={stats?.sessions?.actualQrGenerated || 0} 
                max={Math.max(stats?.sessions?.actualTotal || 1, 1)} 
                variant="primary"
                showLabel
              />
              
              {/* Disconnected Sessions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-secondary-600">Disconnected</span>
                </div>
                <span className="text-sm font-semibold text-secondary-900">{stats?.sessions?.actualDisconnected || 0}</span>
              </div>
              <Progress 
                value={stats?.sessions?.actualDisconnected || 0} 
                max={Math.max(stats?.sessions?.actualTotal || 1, 1)} 
                variant="danger"
                showLabel
              />
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Sessions</Card.Title>
          <Card.Description>Your latest WhatsApp connections</Card.Description>
        </Card.Header>
        <Card.Body>
          {sessions.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sessions.slice(0, 8).map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
              {sessions.length > 8 && (
                <div className="text-center mt-4">
                  <Link 
                    to="/sessions" 
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View all {sessions.length} sessions →
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Smartphone className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600 mb-2">No sessions found</p>
              <p className="text-xs text-secondary-500 mb-4">Create your first session to get started</p>
              <button 
                onClick={handleNewSession}
                className="btn btn-primary"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Create New Session
              </button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <Card.Title>Quick Actions</Card.Title>
          <Card.Description>Common tasks and shortcuts</Card.Description>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={handleSendMessage}
              className="btn btn-primary flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </button>
            <button 
              onClick={handleNewSession}
              className="btn btn-whatsapp flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              New Session
            </button>
            <button 
              onClick={handleViewAnalytics}
              className="btn btn-secondary flex items-center justify-center hover:scale-105 transition-transform"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </button>
            <button 
              onClick={handleScheduleMessage}
              className="btn btn-outline flex items-center justify-center hover:scale-105 transition-transform border-2 border-secondary-300 text-secondary-700 hover:bg-secondary-100 hover:border-secondary-400 hover:text-secondary-900"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Message
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DashboardPage; 