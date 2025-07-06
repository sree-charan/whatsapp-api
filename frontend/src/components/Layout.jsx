import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  Webhook, 
  User, 
  LogOut, 
  Smartphone,
  Home,
  ChevronRight,
  Bell,
  Search,
  BookOpen,
  Shield,
  Activity,
  Zap,
  HelpCircle,
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [notifications, setNotifications] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home, 
      badge: null,
      description: 'Overview & analytics'
    },
    { 
      name: 'Sessions', 
      href: '/sessions', 
      icon: Smartphone, 
      badge: '2',
      description: 'WhatsApp connections'
    },
    { 
      name: 'Messages', 
      href: '/messages', 
      icon: MessageSquare, 
      badge: null,
      description: 'Send & manage messages'
    },
    { 
      name: 'Webhooks', 
      href: '/webhooks', 
      icon: Webhook, 
      badge: null,
      description: 'Event notifications'
    },
    { 
      name: 'API Docs', 
      href: '/api', 
      icon: BookOpen, 
      badge: null,
      description: 'Documentation & guides'
    },
    { 
      name: 'Profile', 
      href: '/profile', 
      icon: User, 
      badge: null,
      description: 'Account settings'
    },
  ];

  const quickActions = [
    { name: 'API Status', icon: Activity, color: 'text-green-500' },
    { name: 'Security', icon: Shield, color: 'text-blue-500' },
    { name: 'Help', icon: HelpCircle, color: 'text-purple-500' },
  ];

  // Breadcrumb generation
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', href: '/' }];
    
    paths.forEach((path, index) => {
      const href = `/${paths.slice(0, index + 1).join('/')}`;
      const name = path.charAt(0).toUpperCase() + path.slice(1);
      breadcrumbs.push({ name, href });
    });
    
    return breadcrumbs;
  };

  const NavItem = ({ item, mobile = false }) => (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `group relative flex items-center px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ease-out hover:scale-[1.02] ${
          isActive
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 transform scale-[1.02]'
            : 'text-secondary-700 hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-purple-50 hover:shadow-md'
        }`
      }
      onClick={() => setSidebarOpen(false)}
    >
      <div className={`flex-shrink-0 mr-3 p-1.5 rounded-xl transition-all duration-300 ${
        location.pathname === item.href 
          ? 'bg-white/20' 
          : 'group-hover:bg-white/10 group-hover:scale-110'
      }`}>
        <item.icon className="h-5 w-5 transition-all duration-300" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium">{item.name}</span>
          {item.badge && (
            <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full transition-all duration-300 ${
              location.pathname === item.href
                ? 'bg-white/20 text-white'
                : 'bg-primary-100 text-primary-700 group-hover:bg-primary-200'
            }`}>
              {item.badge}
            </span>
          )}
        </div>
        {!mobile && (
          <p className={`text-xs mt-0.5 transition-all duration-300 ${
            location.pathname === item.href
              ? 'text-white/80'
              : 'text-secondary-500 group-hover:text-primary-600'
          }`}>
            {item.description}
          </p>
        )}
      </div>

      {/* Active indicator */}
      {location.pathname === item.href && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
      )}
    </NavLink>
  );

  const QuickActionButton = ({ action }) => (
    <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition-all duration-200 hover:scale-110 group">
      <action.icon className={`w-5 h-5 ${action.color} group-hover:scale-110 transition-transform`} />
    </button>
  );

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex w-full max-w-sm flex-1 flex-col bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex grow flex-col overflow-y-auto pt-6 pb-4">
            {/* Mobile Logo */}
            <div className="flex items-center flex-shrink-0 px-6 mb-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-whatsapp-500 to-whatsapp-600 flex items-center justify-center shadow-lg shadow-whatsapp-500/25">
                    <MessageSquare className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                    WhatsApp API
                  </h1>
                  <div className="flex items-center mt-1">
                    <div className={`w-2 h-2 rounded-full mr-2 ${onlineStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="text-xs text-secondary-500">
                      {onlineStatus ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Navigation */}
            <nav className="flex-1 space-y-2 px-4">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} mobile />
              ))}
            </nav>

            {/* Mobile Quick Actions */}
            <div className="px-4 py-4">
              <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="flex space-x-2">
                {quickActions.map((action) => (
                  <QuickActionButton key={action.name} action={action} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Mobile User Section */}
          <div className="flex-shrink-0 border-t border-secondary-200/50 p-4 bg-gradient-to-r from-secondary-50/50 to-primary-50/50">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-secondary-900">{user?.username}</p>
                <p className="text-xs text-secondary-500">{user?.email}</p>
              </div>
              <div className="flex items-center space-x-1">
                {onlineStatus ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-3 text-sm font-medium text-red-700 hover:text-red-900 hover:bg-red-50 rounded-xl transition-all duration-200 group"
            >
              <LogOut className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto border-r border-secondary-200/50 bg-white/90 backdrop-blur-xl pt-6 shadow-xl shadow-secondary-500/5">
          
          {/* Desktop Logo */}
          <div className="flex items-center flex-shrink-0 px-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-r from-whatsapp-500 to-whatsapp-600 flex items-center justify-center shadow-lg shadow-whatsapp-500/25 hover:shadow-xl hover:shadow-whatsapp-500/30 transition-all duration-300">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  WhatsApp API
                </h1>
                <div className="flex items-center mt-1">
                  <div className={`w-2 h-2 rounded-full mr-2 animate-pulse ${onlineStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-sm text-secondary-500 font-medium">
                    {onlineStatus ? 'System Online' : 'System Offline'}
                  </p>
                  <Zap className="w-3 h-3 ml-1 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="flex-1 space-y-2 px-4">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* Quick Actions Section */}
          <div className="px-4 py-6 border-t border-secondary-200/50">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Quick Actions</p>
              <ExternalLink className="w-3 h-3 text-secondary-400" />
            </div>
            <div className="flex space-x-2">
              {quickActions.map((action) => (
                <QuickActionButton key={action.name} action={action} />
              ))}
            </div>
          </div>
          
          {/* Desktop User Section */}
          <div className="flex-shrink-0 border-t border-secondary-200/50 p-6 bg-gradient-to-r from-secondary-50/50 to-primary-50/50">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
                  <User className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-semibold text-secondary-900">{user?.username}</p>
                <p className="text-xs text-secondary-500">{user?.email}</p>
                <div className="flex items-center mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-secondary-500">Active now</span>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                {onlineStatus ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                {notifications > 0 && (
                  <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-3 text-sm font-medium text-red-700 hover:text-red-900 hover:bg-red-50 rounded-xl transition-all duration-200 group hover:scale-[1.02]"
            >
              <LogOut className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-80">
        {/* Enhanced Top header */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-secondary-200/50 shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-secondary-700 lg:hidden hover:bg-secondary-100 rounded-xl transition-all duration-200 hover:scale-110"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {/* Enhanced Breadcrumbs */}
              <nav className="flex ml-4 lg:ml-0" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  {breadcrumbs.map((crumb, index) => (
                    <li key={crumb.href} className="flex items-center">
                      {index > 0 && <ChevronRight className="h-4 w-4 text-secondary-400 mx-2" />}
                      <NavLink
                        to={crumb.href}
                        className={`text-sm font-medium transition-all duration-200 hover:scale-105 ${
                          index === breadcrumbs.length - 1
                            ? 'text-primary-600 font-semibold'
                            : 'text-secondary-500 hover:text-secondary-700'
                        }`}
                      >
                        {crumb.name}
                      </NavLink>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
            
            <div className="flex items-center gap-x-4">
              {/* Enhanced Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search sessions, messages..."
                  className="input pl-10 pr-4 py-2 w-72 bg-secondary-50/50 border-secondary-200/50 focus:bg-white focus:border-primary-300 transition-all duration-200"
                />
              </div>
              
              {/* Enhanced Notifications */}
              <button className="relative p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-xl transition-all duration-200 hover:scale-110">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {notifications}
                  </span>
                )}
              </button>
              
              {/* User menu with status */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-secondary-700">{user?.username}</p>
                  <div className="flex items-center justify-end">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                    <span className="text-xs text-secondary-500">Online</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 bg-transparent">
          <div className="container-responsive py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 