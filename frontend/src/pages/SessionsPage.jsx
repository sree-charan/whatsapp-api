import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Smartphone, 
  Play, 
  Square, 
  RotateCw, 
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  QrCode,
  Search,
  Filter,
  Wifi,
  WifiOff,
  Activity,
  Users,
  Settings,
  Eye,
  Edit3,
  MoreVertical,
  Power,
  PowerOff,
  Zap,
  Shield,
  Calendar,
  Timer,
  Bell,
  BellOff,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Globe,
  Phone,
  MessageSquare,
  Loader,
  TrendingUp,
  Signal,
  Link2,
  Sparkles,
  Star,
  Heart
} from 'lucide-react';
import { sessionsAPI, handleApiError } from '../services/api';
import { 
  Card, 
  Button, 
  Input, 
  Badge,
  LoadingOverlay,
  Modal,
  useToast
} from '../components/ui';

const SessionsPage = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounced search to prevent excessive filtering
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchSessions = async () => {
    try {
      const response = await sessionsAPI.list();
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateSession = async (sessionData) => {
    try {
      await sessionsAPI.create(sessionData);
      toast.success('Session created successfully!');
      setShowCreateModal(false);
      fetchSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  const handleStartSession = async (sessionId) => {
    try {
      await sessionsAPI.start(sessionId);
      toast.success('Session started successfully!');
      fetchSessions();
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    }
  };

  const handleStopSession = async (sessionId) => {
    try {
      await sessionsAPI.stop(sessionId);
      toast.success('Session stopped successfully!');
      fetchSessions();
    } catch (error) {
      console.error('Error stopping session:', error);
      toast.error('Failed to stop session');
    }
  };

  const handleRestartSession = async (sessionId) => {
    try {
      await sessionsAPI.restart(sessionId);
      toast.success('Session restarted successfully!');
      fetchSessions();
    } catch (error) {
      console.error('Error restarting session:', error);
      toast.error('Failed to restart session');
    }
  };

  const handleClearAuthSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to clear the authentication state? This will force a fresh QR code generation.')) return;
    
    try {
      await sessionsAPI.clearAuth(sessionId);
      toast.success('Session auth cleared successfully!');
      fetchSessions();
    } catch (error) {
      console.error('Error clearing session auth:', error);
      toast.error('Failed to clear session auth');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;
    
    try {
      await sessionsAPI.delete(sessionId);
      toast.success('Session deleted successfully!');
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const handleShowQR = async (session) => {
    try {
      setSelectedSession(session);
      setQrCode(null);
      setQrLoading(true);
      setShowQRModal(true);
      
      const response = await sessionsAPI.getQR(session.id);
      
      if (response.data && (response.data.qr || response.data.qrCode)) {
        const qrCodeData = response.data.qr || response.data.qrCode;
        setQrCode(qrCodeData);
        toast.success('QR code loaded successfully!');
      } else {
        throw new Error('QR code data not found in response');
      }
    } catch (error) {
      console.error('Error getting QR code:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to get QR code';
      toast.error(`${errorMessage}. Please try restarting the session.`);
      setQrCode(null);
    } finally {
      setQrLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchSessions();
  };

  // Memoized filtered sessions to prevent unnecessary recalculations
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchesSearch = session.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                           (session.phoneNumber && session.phoneNumber.includes(debouncedSearchTerm));
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sessions, debouncedSearchTerm, statusFilter]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-gradient-to-r from-emerald-500 to-green-500',
          textColor: 'text-white',
          icon: CheckCircle,
          iconColor: 'text-emerald-500',
          bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50',
          borderColor: 'border-emerald-200',
          label: 'Connected',
          pulse: 'animate-pulse',
          glow: 'shadow-emerald-500/25'
        };
      case 'connecting':
        return {
          color: 'bg-gradient-to-r from-amber-500 to-orange-500',
          textColor: 'text-white',
          icon: Clock,
          iconColor: 'text-amber-500',
          bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
          borderColor: 'border-amber-200',
          label: 'Connecting',
          pulse: 'animate-bounce',
          glow: 'shadow-amber-500/25'
        };
      case 'qr_generated':
        return {
          color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          textColor: 'text-white',
          icon: QrCode,
          iconColor: 'text-blue-500',
          bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          label: 'QR Ready',
          pulse: 'animate-pulse',
          glow: 'shadow-blue-500/25'
        };
      case 'disconnected':
        return {
          color: 'bg-gradient-to-r from-red-500 to-pink-500',
          textColor: 'text-white',
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-gradient-to-br from-red-50 to-pink-50',
          borderColor: 'border-red-200',
          label: 'Disconnected',
          pulse: '',
          glow: 'shadow-red-500/25'
        };
      case 'inactive':
        return {
          color: 'bg-gradient-to-r from-gray-500 to-slate-500',
          textColor: 'text-white',
          icon: PowerOff,
          iconColor: 'text-gray-500',
          bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50',
          borderColor: 'border-gray-200',
          label: 'Inactive',
          pulse: '',
          glow: 'shadow-gray-500/25'
        };
      default:
        return {
          color: 'bg-gradient-to-r from-gray-500 to-slate-500',
          textColor: 'text-white',
          icon: AlertCircle,
          iconColor: 'text-gray-500',
          bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50',
          borderColor: 'border-gray-200',
          label: 'Unknown',
          pulse: '',
          glow: 'shadow-gray-500/25'
        };
    }
  };

  const getSessionStats = () => {
    const connected = sessions.filter(s => s.status === 'connected').length;
    const connecting = sessions.filter(s => s.status === 'connecting').length;
    const qr_generated = sessions.filter(s => s.status === 'qr_generated').length;
    const disconnected = sessions.filter(s => s.status === 'disconnected').length;
    const inactive = sessions.filter(s => s.status === 'inactive').length;
    
    return { connected, connecting, qr_generated, disconnected, inactive, total: sessions.length };
  };

  const stats = getSessionStats();

  const CreateSessionModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      autoStart: true,
      webhook: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleCreateSession(formData);
    };

    return (
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title="Create New Session"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Session Name *
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter a descriptive name for your session"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Optional description for this session"
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Webhook URL
              </label>
              <Input
                type="url"
                value={formData.webhook}
                onChange={(e) => setFormData({...formData, webhook: e.target.value})}
                placeholder="https://your-webhook-url.com/webhook"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">
                Optional webhook URL to receive message notifications
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="autoStart"
                checked={formData.autoStart}
                onChange={(e) => setFormData({...formData, autoStart: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoStart" className="text-sm text-gray-700">
                Auto-start session after creation
              </label>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    );
  };

  const QRModal = () => {
    const handleCloseModal = () => {
      setShowQRModal(false);
      setQrCode(null);
      setQrLoading(false);
      setSelectedSession(null);
    };

    const handleRefreshQR = async () => {
      if (!selectedSession || qrLoading) return;
      
      setQrCode(null);
      setQrLoading(true);
      
      try {
        const response = await sessionsAPI.getQR(selectedSession.id);
        
        if (response.data && (response.data.qr || response.data.qrCode)) {
          const qrCodeData = response.data.qr || response.data.qrCode;
          setQrCode(qrCodeData);
          toast.success('QR code refreshed successfully!');
        } else {
          throw new Error('QR code data not found in response');
        }
      } catch (error) {
        console.error('Error refreshing QR code:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to refresh QR code';
        toast.error(`${errorMessage}. Please try restarting the session.`);
        setQrCode(null);
      } finally {
        setQrLoading(false);
      }
    };

    return (
      <Modal 
        isOpen={showQRModal} 
        onClose={handleCloseModal}
        title="WhatsApp QR Code"
        maxWidth="md"
      >
        <div className="text-center space-y-6">
          {qrCode && !qrLoading ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 inline-block shadow-lg">
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="mx-auto w-64 h-64 object-contain"
                  onError={(e) => {
                    console.error('QR code image failed to load:', e);
                    toast.error('QR code image failed to load');
                    setQrCode(null);
                  }}
                  onLoad={() => {
                    console.log('QR code image loaded successfully');
                  }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Scan with WhatsApp
                </h3>
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  Open WhatsApp on your phone, go to Settings → Linked Devices → Link a Device, 
                  and scan this QR code
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  QR Code Active
                </div>
              </div>
              <div className="flex space-x-3 justify-center">
                <Button
                  onClick={handleRefreshQR}
                  variant="secondary"
                  size="sm"
                  className="flex items-center justify-center"
                  disabled={qrLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${qrLoading ? 'animate-spin' : ''}`} />
                  {qrLoading ? 'Refreshing...' : 'Refresh QR'}
                </Button>
                <Button
                  onClick={handleCloseModal}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-12">
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin mx-auto" style={{animationDelay: '0.5s', animationDuration: '1.5s'}}></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {qrLoading ? 'Generating QR Code...' : 'QR Code Unavailable'}
              </h3>
              <p className="text-gray-600 mb-4">
                {qrLoading 
                  ? 'Please wait while we generate your QR code' 
                  : 'QR code could not be loaded'
                }
              </p>
              {!qrLoading && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Try restarting the session to generate a new QR code
                  </p>
                  <div className="flex space-x-3 justify-center">
                    <Button
                      onClick={handleRefreshQR}
                      variant="secondary"
                      size="sm"
                      className="flex items-center justify-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                    <Button
                      onClick={handleCloseModal}
                      variant="outline"
                      size="sm"
                      className="flex items-center justify-center"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-600 rounded-full animate-spin mx-auto" style={{animationDelay: '0.5s', animationDuration: '1.5s'}}></div>
          </div>
          <p className="text-gray-600 font-medium">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50" style={{scrollBehavior: 'smooth'}}>
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <Smartphone className="text-white h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                  WhatsApp Sessions
                </h1>
                <p className="text-gray-600 text-lg">Manage your WhatsApp connections with style</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Session
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600 mb-1">Total Sessions</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-600 mb-1">Connected</p>
                <p className="text-3xl font-bold text-emerald-900">{stats.connected}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-600 mb-1">Connecting</p>
                <p className="text-3xl font-bold text-amber-900">{stats.connecting}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
                <Clock className="h-6 w-6 text-white animate-pulse" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-violet-600 mb-1">QR Ready</p>
                <p className="text-3xl font-bold text-violet-900">{stats.qr_generated}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl shadow-lg">
                <QrCode className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-600 mb-1">Disconnected</p>
                <p className="text-3xl font-bold text-red-900">{stats.disconnected}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Inactive</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-gray-500 to-slate-500 rounded-xl shadow-lg">
                <PowerOff className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Filters and Controls */}
        <Card className="p-6 mb-8 bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search sessions by ID or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 w-full bg-white/50 border-gray-200 focus:bg-white transition-colors duration-200"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                >
                  <option value="all">All Status</option>
                  <option value="connected">Connected</option>
                  <option value="connecting">Connecting</option>
                  <option value="qr_generated">QR Ready</option>
                  <option value="disconnected">Disconnected</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <Button
                onClick={handleManualRefresh}
                variant="secondary"
                size="sm"
                className="bg-white/80 backdrop-blur-sm hover:bg-white/90 flex items-center justify-center"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Enhanced Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {searchTerm || statusFilter !== 'all' ? 'No sessions found' : 'No sessions yet'}
              </h3>
              <p className="text-gray-600 mb-8">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria to find the sessions you\'re looking for.' 
                  : 'Create your first WhatsApp session to start sending and receiving messages.'
                }
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Session
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSessions.map((session) => {
              const statusConfig = getStatusConfig(session.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={session.id} className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Session Header */}
                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className={`relative p-4 rounded-2xl ${statusConfig.bgColor} ${statusConfig.borderColor} border-2 shadow-lg ${statusConfig.glow} transition-all duration-300 group-hover:scale-110`}>
                          <StatusIcon className={`h-6 w-6 ${statusConfig.iconColor} ${statusConfig.pulse}`} />
                          {session.status === 'connected' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate mb-1">
                            Session {session.id.substring(0, 8)}...
                          </h3>
                          <p className="text-sm text-gray-600 truncate flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {session.phoneNumber || 'Not connected'}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color} ${statusConfig.textColor} shadow-md`}>
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Session Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm bg-gray-50/50 rounded-lg p-3">
                        <span className="text-gray-600 font-medium">Session ID</span>
                        <span className="font-mono text-gray-900 text-xs bg-white px-2 py-1 rounded">{session.id}</span>
                      </div>
                      
                      {session.phoneNumber && (
                        <div className="flex items-center justify-between text-sm bg-gray-50/50 rounded-lg p-3">
                          <span className="text-gray-600 font-medium">Phone Number</span>
                          <span className="font-semibold text-gray-900">{session.phoneNumber}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm bg-gray-50/50 rounded-lg p-3">
                        <span className="text-gray-600 font-medium">Created</span>
                        <span className="text-gray-900">{new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm bg-gray-50/50 rounded-lg p-3">
                        <span className="text-gray-600 font-medium">Last Update</span>
                        <span className="text-gray-900">{new Date(session.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {session.status === 'inactive' && (
                          <>
                            <Button
                              onClick={() => handleStartSession(session.id)}
                              size="sm"
                              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white flex-1 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Start
                            </Button>
                            <Button
                              onClick={() => handleRestartSession(session.id)}
                              variant="secondary"
                              size="sm"
                              className="flex-1 bg-white/50 hover:bg-white/70 backdrop-blur-sm flex items-center justify-center"
                            >
                              <RotateCw className="w-4 h-4 mr-2" />
                              Fresh Start
                            </Button>
                          </>
                        )}
                        
                        {session.status === 'connecting' && (
                          <>
                            <Button
                              disabled
                              size="sm"
                              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white flex-1 cursor-not-allowed shadow-lg flex items-center justify-center"
                            >
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              Connecting...
                            </Button>
                            <Button
                              onClick={() => handleRestartSession(session.id)}
                              variant="secondary"
                              size="sm"
                              className="flex-1 bg-white/50 hover:bg-white/70 backdrop-blur-sm flex items-center justify-center"
                            >
                              <RotateCw className="w-4 h-4 mr-2" />
                              Force Restart
                            </Button>
                          </>
                        )}
                        
                        {session.status === 'connected' && (
                          <Button
                            onClick={() => handleStopSession(session.id)}
                            variant="secondary"
                            size="sm"
                            className="flex-1 bg-white/50 hover:bg-white/70 backdrop-blur-sm flex items-center justify-center"
                          >
                            <Square className="w-4 h-4 mr-2" />
                            Stop
                          </Button>
                        )}
                        
                        {session.status === 'disconnected' && (
                          <>
                            <Button
                              onClick={() => handleRestartSession(session.id)}
                              variant="secondary"
                              size="sm"
                              className="flex-1 bg-white/50 hover:bg-white/70 backdrop-blur-sm flex items-center justify-center"
                            >
                              <RotateCw className="w-4 h-4 mr-2" />
                              Restart
                            </Button>
                            <Button
                              onClick={() => handleShowQR(session)}
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex-1 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                            >
                              <QrCode className="w-4 h-4 mr-2" />
                              QR Code
                            </Button>
                          </>
                        )}
                        
                        {session.status === 'qr_generated' && (
                          <Button
                            onClick={() => handleShowQR(session)}
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex-1 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            Scan QR Code
                          </Button>
                        )}
                      </div>

                      {/* View Details Button */}
                      <Link to={`/sessions/${session.id}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-violet-100 transition-all duration-300 flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>

                      {/* Danger Zone */}
                      <div className="pt-4 border-t border-gray-200/50 space-y-2">
                        <Button
                          onClick={() => handleClearAuthSession(session.id)}
                          variant="secondary"
                          size="sm"
                          className="w-full bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 text-orange-700 hover:from-orange-100 hover:to-amber-100 transition-all duration-300 flex items-center justify-center"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Clear Auth (Force Fresh QR)
                        </Button>
                        <Button
                          onClick={() => handleDeleteSession(session.id)}
                          variant="danger"
                          size="sm"
                          className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Session
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modals */}
        {showCreateModal && <CreateSessionModal />}
        {showQRModal && <QRModal />}
      </div>
    </div>
  );
};

export default SessionsPage; 