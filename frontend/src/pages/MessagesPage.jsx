import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  Users, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  X, 
  FileText, 
  Image, 
  MapPin, 
  User, 
  Package, 
  Video, 
  Mic,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowRight,
  MessageCircle,
  Zap,
  Eye,
  Check,
  CheckCheck,
  Copy,
  Trash2,
  Edit3,
  Settings,
  MoreVertical,
  Paperclip,
  Smile,
  ChevronDown,
  ChevronUp,
  Star,
  Archive,
  Flag
} from 'lucide-react';
import { messagesAPI, sessionsAPI, handleApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Card, 
  Button, 
  Input, 
  Badge,
  LoadingOverlay,
  SkeletonCard,
  useToast
} from '../components/ui';

const MessagesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('send');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [messageHistory, setMessageHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Send message form state
  const [messageForm, setMessageForm] = useState({
    type: 'text',
    to: '',
    text: '',
    file: null,
    filename: '',
    caption: '',
    latitude: '',
    longitude: '',
    address: '',
    name: '',
    organization: '',
    phones: [{ number: '', type: 'mobile' }],
    emails: [{ email: '', type: 'personal' }]
  });

  // Bulk message state
  const [bulkForm, setBulkForm] = useState({
    type: 'text',
    text: '',
    recipients: [''],
    file: null,
    filename: '',
    caption: ''
  });

  // History filters
  const [historyFilters, setHistoryFilters] = useState({
    search: '',
    type: 'all',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load message history when session changes
  useEffect(() => {
    if (selectedSession && activeTab === 'history') {
      loadMessageHistory();
    }
  }, [selectedSession, activeTab, historyFilters]);

  const loadSessions = async () => {
    try {
      const response = await sessionsAPI.list();
      setSessions(response.data.sessions || []);
      if (response.data.sessions?.length > 0) {
        setSelectedSession(response.data.sessions[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load sessions');
    }
  };

  const loadMessageHistory = async () => {
    if (!selectedSession) return;
    
    setLoading(true);
    try {
      const response = await messagesAPI.getHistory(selectedSession, historyFilters);
      setMessageHistory(response.data.data.messages || []);
    } catch (error) {
      handleApiError(error, 'Failed to load message history');
      toast.error('Failed to load message history');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedSession) {
      toast.error('Please select a session first');
      return;
    }

    setSendingMessage(true);
    try {
      let response;
      let fileUrl = null;

      // Upload file first if needed
      if (['image', 'video', 'audio', 'document'].includes(messageForm.type) && messageForm.file) {
        try {
          const uploadResponse = await messagesAPI.uploadFile(messageForm.file);
          fileUrl = uploadResponse.data.data.url;
        } catch (uploadError) {
          throw new Error(`File upload failed: ${uploadError.response?.data?.message || uploadError.message}`);
        }
      }

      switch (messageForm.type) {
        case 'text':
          response = await messagesAPI.sendText({
            sessionId: selectedSession,
            to: messageForm.to,
            message: messageForm.text
          });
          break;
        
        case 'image':
          if (!fileUrl) {
            throw new Error('Please select an image file');
          }
          response = await messagesAPI.sendImage({
            sessionId: selectedSession,
            to: messageForm.to,
            image: fileUrl,
            caption: messageForm.caption
          });
          break;
        
        case 'video':
          if (!fileUrl) {
            throw new Error('Please select a video file');
          }
          response = await messagesAPI.sendVideo({
            sessionId: selectedSession,
            to: messageForm.to,
            video: fileUrl,
            caption: messageForm.caption
          });
          break;
        
        case 'audio':
          if (!fileUrl) {
            throw new Error('Please select an audio file');
          }
          response = await messagesAPI.sendAudio({
            sessionId: selectedSession,
            to: messageForm.to,
            audio: fileUrl
          });
          break;
        
        case 'document':
          if (!fileUrl) {
            throw new Error('Please select a document file');
          }
          response = await messagesAPI.sendDocument({
            sessionId: selectedSession,
            to: messageForm.to,
            document: fileUrl,
            fileName: messageForm.filename || messageForm.file?.name,
            caption: messageForm.caption
          });
          break;
        
        case 'location':
          response = await messagesAPI.sendLocation({
            sessionId: selectedSession,
            to: messageForm.to,
            latitude: parseFloat(messageForm.latitude),
            longitude: parseFloat(messageForm.longitude),
            address: messageForm.address
          });
          break;
        
        case 'contact':
          response = await messagesAPI.sendContact({
            sessionId: selectedSession,
            to: messageForm.to,
            contact: {
              name: messageForm.name,
              organization: messageForm.organization,
              phones: messageForm.phones.filter(p => p.number),
              emails: messageForm.emails.filter(e => e.email)
            }
          });
          break;
        
        default:
          throw new Error('Unknown message type');
      }

      if (response.data.success) {
        toast.success('Message sent successfully!');
        // Reset form
        setMessageForm({
          type: 'text',
          to: '',
          text: '',
          file: null,
          filename: '',
          caption: '',
          latitude: '',
          longitude: '',
          address: '',
          name: '',
          organization: '',
          phones: [{ number: '', type: 'mobile' }],
          emails: [{ email: '', type: 'personal' }]
        });
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send message';
      console.error('Error sending message:', error);
      toast.error(errorMessage);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleBulkSend = async (e) => {
    e.preventDefault();
    if (!selectedSession) {
      alert('Please select a session first');
      return;
    }

    const validRecipients = bulkForm.recipients.filter(r => r.trim());
    if (validRecipients.length === 0) {
      alert('Please add at least one recipient');
      return;
    }

    // Validate message content based on type
    if (bulkForm.type === 'text' && !bulkForm.text.trim()) {
      alert('Please enter a message');
      return;
    }

    setSendingMessage(true);
    try {
      // Format recipients for WhatsApp JIDs
      const formattedRecipients = validRecipients.map(recipient => {
        const cleaned = recipient.replace(/\D/g, ''); // Remove non-digits
        return cleaned.includes('@') ? cleaned : `${cleaned}@s.whatsapp.net`;
      });

      // Prepare message payload based on type
      let messagePayload;
      if (bulkForm.type === 'text') {
        messagePayload = bulkForm.text;
      } else if (bulkForm.type === 'image') {
        // For now, bulk image messages are not supported without file upload
        alert('Bulk image messages require file URLs. Please use text messages for bulk sending.');
        return;
      } else if (bulkForm.type === 'document') {
        // For now, bulk document messages are not supported without file upload
        alert('Bulk document messages require file URLs. Please use text messages for bulk sending.');
        return;
      } else {
        alert('Only text messages are supported for bulk sending');
        return;
      }

      const response = await messagesAPI.sendBulk({
        sessionId: selectedSession,
        type: bulkForm.type,
        recipients: formattedRecipients,
        message: messagePayload
      });

      if (response.data.success) {
        const { data } = response.data;
        alert(`Bulk message sent! ${data.successful} succeeded, ${data.failed} failed`);
        
        // Show detailed results if there were failures
        if (data.failed > 0 && data.errors?.length > 0) {
          console.log('Bulk message errors:', data.errors);
          const errorDetails = data.errors.map(err => `${err.recipient}: ${err.error}`).join('\n');
          alert(`Failed messages:\n${errorDetails}`);
        }
        
        setBulkForm({
          type: 'text',
          text: '',
          recipients: [''],
          file: null,
          filename: '',
          caption: ''
        });
      }
    } catch (error) {
      console.error('Bulk message error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send bulk message';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSendingMessage(false);
    }
  };

  const addRecipient = () => {
    setBulkForm(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const removeRecipient = (index) => {
    setBulkForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const updateRecipient = (index, value) => {
    setBulkForm(prev => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => i === index ? value : r)
    }));
  };

  const addContactField = (field) => {
    setMessageForm(prev => ({
      ...prev,
      [field]: [...prev[field], field === 'phones' ? { number: '', type: 'mobile' } : { email: '', type: 'personal' }]
    }));
  };

  const removeContactField = (field, index) => {
    setMessageForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateContactField = (field, index, key, value) => {
    setMessageForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? { ...item, [key]: value } : item)
    }));
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderSendTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Panel - Session Selection & Quick Actions */}
      <div className="lg:col-span-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="mr-2 text-blue-600" size={20} />
            Active Sessions
          </h3>
          
          <div className="space-y-3">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedSession === session.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-medium text-gray-900 truncate">
                      {session.phoneNumber || `Session ${session.id}`}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      ID: {session.id}
                    </p>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <Badge 
                      variant={session.status === 'connected' ? 'success' : 'secondary'}
                      className="text-xs mb-1"
                    >
                      {session.status}
                    </Badge>
                    <p className="text-xs text-gray-400 text-right">
                      {session.lastSeen ? formatTimestamp(session.lastSeen) : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Message Composer */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="mr-2 text-blue-600" size={20} />
              Compose Message
            </h3>
            {selectedSession && (
              <p className="text-sm text-gray-500 mt-1">
                Sending from: {sessions.find(s => s.id === selectedSession)?.phoneNumber || selectedSession}
              </p>
            )}
          </div>

          {/* Message Type Selector */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'text', icon: MessageSquare, label: 'Text' },
                { type: 'image', icon: Image, label: 'Image' },
                { type: 'video', icon: Video, label: 'Video' },
                { type: 'audio', icon: Mic, label: 'Audio' },
                { type: 'document', icon: FileText, label: 'Document' },
                { type: 'location', icon: MapPin, label: 'Location' },
                { type: 'contact', icon: User, label: 'Contact' }
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setMessageForm(prev => ({ ...prev, type }))}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-all duration-200 ${
                    messageForm.type === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Form */}
          <form onSubmit={handleSendMessage} className="flex-1 flex flex-col">
            {/* Recipient Input */}
            <div className="p-6 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>
              <input
                type="text"
                value={messageForm.to}
                onChange={(e) => setMessageForm(prev => ({ ...prev, to: e.target.value }))}
                placeholder="Enter phone number (e.g., 1234567890)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Message Content */}
            <div className="flex-1 p-6">
              {messageForm.type === 'text' && (
                <div className="h-full flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={messageForm.text}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Type your message here..."
                    className="flex-1 min-h-[120px] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>
              )}

              {(messageForm.type === 'image' || messageForm.type === 'video' || messageForm.type === 'audio' || messageForm.type === 'document') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                      <input
                        type="file"
                        onChange={(e) => setMessageForm(prev => ({ ...prev, file: e.target.files[0] }))}
                        className="hidden"
                        id="file-upload"
                        accept={
                          messageForm.type === 'image' ? 'image/*' :
                          messageForm.type === 'video' ? 'video/*' :
                          messageForm.type === 'audio' ? 'audio/*' :
                          '*/*'
                        }
                        required
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {messageForm.type === 'image' ? 'PNG, JPG, GIF up to 10MB' :
                           messageForm.type === 'video' ? 'MP4, MOV up to 50MB' :
                           messageForm.type === 'audio' ? 'MP3, WAV up to 20MB' :
                           'Any file up to 100MB'}
                        </p>
                      </label>
                      {messageForm.file && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">
                            {messageForm.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(messageForm.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {messageForm.type === 'document' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Filename (Optional)
                      </label>
                      <input
                        type="text"
                        value={messageForm.filename}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, filename: e.target.value }))}
                        placeholder="Enter custom filename"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  {(messageForm.type === 'image' || messageForm.type === 'video' || messageForm.type === 'document') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Caption (Optional)
                      </label>
                      <textarea
                        value={messageForm.caption}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, caption: e.target.value }))}
                        placeholder="Add a caption..."
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {messageForm.type === 'location' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={messageForm.latitude}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, latitude: e.target.value }))}
                        placeholder="37.7749"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={messageForm.longitude}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, longitude: e.target.value }))}
                        placeholder="-122.4194"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={messageForm.address}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter address or location name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {messageForm.type === 'contact' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={messageForm.name}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contact name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization
                      </label>
                      <input
                        type="text"
                        value={messageForm.organization}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, organization: e.target.value }))}
                        placeholder="Company/Organization"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Numbers
                    </label>
                    <div className="space-y-2">
                      {messageForm.phones.map((phone, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={phone.number}
                            onChange={(e) => updateContactField('phones', index, 'number', e.target.value)}
                            placeholder="Phone number"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <select
                            value={phone.type}
                            onChange={(e) => updateContactField('phones', index, 'type', e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="mobile">Mobile</option>
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeContactField('phones', index)}
                            className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addContactField('phones')}
                        className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Phone Number
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Addresses
                    </label>
                    <div className="space-y-2">
                      {messageForm.emails.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="email"
                            value={email.email}
                            onChange={(e) => updateContactField('emails', index, 'email', e.target.value)}
                            placeholder="Email address"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <select
                            value={email.type}
                            onChange={(e) => updateContactField('emails', index, 'type', e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="personal">Personal</option>
                            <option value="work">Work</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeContactField('emails', index)}
                            className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addContactField('emails')}
                        className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Email Address
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Send Button */}
            <div className="p-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={sendingMessage || !selectedSession}
                className="w-full flex items-center justify-center py-3 px-6 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendingMessage ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2" size={20} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderBulkTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Session & Campaign Settings */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="mr-2 text-orange-600" size={20} />
            Campaign Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select session</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.phoneNumber || `Session ${session.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Type
              </label>
              <div className="space-y-2">
                {[
                  { type: 'text', icon: MessageSquare, label: 'Text Message' },
                  { type: 'image', icon: Image, label: 'Image' },
                  { type: 'document', icon: FileText, label: 'Document' }
                ].map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBulkForm(prev => ({ ...prev, type }))}
                    className={`w-full flex items-center p-3 rounded-xl border transition-all duration-200 ${
                      bulkForm.type === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Icon size={16} className="mr-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Recipients</span>
                <Badge variant="secondary">
                  {bulkForm.recipients.filter(r => r.trim()).length} contacts
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
                <span>Estimated cost</span>
                <span className="font-medium">
                  ${(bulkForm.recipients.filter(r => r.trim()).length * 0.01).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recipients Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">
                {bulkForm.recipients.filter(r => r.trim()).length}
              </div>
              <div className="text-sm text-blue-600">Recipients</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">
                {selectedSession && sessions.find(s => s.id === selectedSession)?.status === 'connected' ? '✓' : '✗'}
              </div>
              <div className="text-sm text-green-600">Session Ready</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Message Composer */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full">
          <form onSubmit={handleBulkSend} className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="mr-2 text-blue-600" size={20} />
                Bulk Message Campaign
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Send messages to multiple recipients at once
              </p>
            </div>

            {/* Recipients Management */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Recipients
                </label>
                <button
                  type="button"
                  onClick={addRecipient}
                  className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Add Recipient
                </button>
              </div>
              
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {bulkForm.recipients.map((recipient, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={14} className="text-blue-600" />
                    </div>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => updateRecipient(index, e.target.value)}
                      placeholder="Enter phone number"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeRecipient(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              {bulkForm.recipients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No recipients added yet</p>
                  <p className="text-sm">Click "Add Recipient" to get started</p>
                </div>
              )}
            </div>

            {/* Message Content */}
            <div className="flex-1 p-6">
              {bulkForm.type === 'text' && (
                <div className="h-full flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Content
                  </label>
                  <textarea
                    value={bulkForm.text}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Type your bulk message here..."
                    className="flex-1 min-h-[160px] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                  <div className="mt-2 text-sm text-gray-500">
                    Characters: {bulkForm.text.length}/1000
                  </div>
                </div>
              )}

              {(bulkForm.type === 'image' || bulkForm.type === 'document') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                      <input
                        type="file"
                        onChange={(e) => setBulkForm(prev => ({ ...prev, file: e.target.files[0] }))}
                        className="hidden"
                        id="bulk-file-upload"
                        accept={bulkForm.type === 'image' ? 'image/*' : '*/*'}
                        required
                      />
                      <label htmlFor="bulk-file-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {bulkForm.type === 'image' ? 'PNG, JPG, GIF up to 10MB' : 'Any file up to 100MB'}
                        </p>
                      </label>
                      {bulkForm.file && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">
                            {bulkForm.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(bulkForm.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {bulkForm.type === 'document' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Filename (Optional)
                      </label>
                      <input
                        type="text"
                        value={bulkForm.filename}
                        onChange={(e) => setBulkForm(prev => ({ ...prev, filename: e.target.value }))}
                        placeholder="Enter custom filename"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caption (Optional)
                    </label>
                    <textarea
                      value={bulkForm.caption}
                      onChange={(e) => setBulkForm(prev => ({ ...prev, caption: e.target.value }))}
                      placeholder="Add a caption..."
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Send Button */}
            <div className="p-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={sendingMessage || !selectedSession || bulkForm.recipients.filter(r => r.trim()).length === 0}
                className="w-full flex items-center justify-center py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {sendingMessage ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Sending to {bulkForm.recipients.filter(r => r.trim()).length} recipients...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2" size={20} />
                    Send Bulk Message ({bulkForm.recipients.filter(r => r.trim()).length} recipients)
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Messages will be sent with a small delay between each to prevent spam detection
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Panel - Filters & Search */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="mr-2 text-purple-600" size={20} />
            Filters
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sessions</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.phoneNumber || `Session ${session.id}`}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Messages
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={historyFilters.search}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search messages..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Type
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Messages', color: 'gray' },
                  { value: 'incoming', label: 'Incoming', color: 'green' },
                  { value: 'outgoing', label: 'Outgoing', color: 'blue' }
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => setHistoryFilters(prev => ({ ...prev, type: value }))}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                      historyFilters.type === value
                        ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span>{label}</span>
                    {historyFilters.type === value && (
                      <CheckCircle size={16} className={`text-${color}-600`} />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={historyFilters.startDate}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={historyFilters.endDate}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setHistoryFilters(prev => ({ ...prev, search: '', type: 'all', startDate: '', endDate: '' }))}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Clear
              </button>
              <button
                onClick={loadMessageHistory}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* History Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Messages</span>
              <Badge variant="secondary">{messageHistory.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Incoming</span>
              <Badge variant="success">
                {messageHistory.filter(m => m.type === 'incoming').length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Outgoing</span>
              <Badge variant="primary">
                {messageHistory.filter(m => m.type === 'outgoing').length}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Message Timeline */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 2px)' }}>
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="mr-2 text-purple-600" size={20} />
              Message History
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedSession 
                ? `Showing messages for ${sessions.find(s => s.id === selectedSession)?.phoneNumber || selectedSession}` 
                : 'Showing messages from all sessions'}
            </p>
          </div>

          {/* Message Timeline */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600">Loading message history...</p>
                </div>
              </div>
            ) : messageHistory.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No messages found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try adjusting your filters or check back later
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {messageHistory.map((message, index) => (
                    <div key={index} className="relative">
                      {/* Timeline line */}
                      {index !== messageHistory.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200" />
                      )}
                      
                      <div className="flex items-start space-x-4">
                        {/* Message icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                          message.type === 'incoming' 
                            ? 'bg-green-100 border-2 border-green-200' 
                            : 'bg-blue-100 border-2 border-blue-200'
                        }`}>
                          {message.type === 'incoming' ? (
                            <ArrowRight className="h-5 w-5 text-green-600 rotate-180" />
                          ) : (
                            <ArrowRight className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        
                        {/* Message content */}
                        <div className="flex-1 min-w-0">
                          <div className={`rounded-2xl p-4 ${
                            message.type === 'incoming' 
                              ? 'bg-gray-50 border border-gray-200' 
                              : 'bg-blue-50 border border-blue-200'
                          }`}>
                            {/* Message header */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={message.type === 'incoming' ? 'success' : 'primary'}
                                  className="text-xs"
                                >
                                  {message.type === 'incoming' ? 'Received' : 'Sent'}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {message.type === 'incoming' ? message.from : message.to}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(message.timestamp)}
                                </span>
                                {message.type === 'outgoing' && (
                                  <div className="flex items-center">
                                    {message.status === 'delivered' && (
                                      <CheckCheck className="h-4 w-4 text-green-500" />
                                    )}
                                    {message.status === 'sent' && (
                                      <Check className="h-4 w-4 text-gray-500" />
                                    )}
                                    {message.status === 'read' && (
                                      <CheckCheck className="h-4 w-4 text-blue-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Message body */}
                            <div className="text-gray-900">
                              {message.messageType === 'text' ? (
                                <p className="text-sm">
                                  {typeof message.content === 'string' 
                                    ? message.content 
                                    : message.content?.text || message.text || 'No content'}
                                </p>
                              ) : (
                                <div className="flex items-center space-x-2 text-sm">
                                  <div className={`p-2 rounded-lg ${
                                    message.type === 'incoming' ? 'bg-gray-200' : 'bg-blue-200'
                                  }`}>
                                    {message.messageType === 'image' && <Image size={16} />}
                                    {message.messageType === 'video' && <Video size={16} />}
                                    {message.messageType === 'audio' && <Mic size={16} />}
                                    {message.messageType === 'document' && <FileText size={16} />}
                                    {message.messageType === 'location' && <MapPin size={16} />}
                                    {message.messageType === 'contact' && <User size={16} />}
                                  </div>
                                  <div>
                                    <p className="font-medium capitalize">{message.messageType}</p>
                                    {message.caption && (
                                      <p className="text-gray-600 mt-1">{message.caption}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <MessageCircle className="mr-3 text-blue-600" size={32} />
                Messages
              </h1>
              <p className="text-gray-600">Send messages, manage campaigns, and track conversations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="success" className="flex items-center px-4 py-2 text-base">
                <CheckCircle size={20} className="mr-2" />
                {sessions.filter(s => s.status === 'connected').length} Active
              </Badge>
              <Badge variant="secondary" className="flex items-center px-4 py-2 text-base">
                <Clock size={20} className="mr-2" />
                {sessions.length} Total Sessions
              </Badge>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1">
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('send')}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                  activeTab === 'send' 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Send size={16} className="mr-2" />
                Send Messages
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                  activeTab === 'bulk' 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Users size={16} className="mr-2" />
                Bulk Messages
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                  activeTab === 'history' 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Clock size={16} className="mr-2" />
                Message History
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'send' && renderSendTab()}
          {activeTab === 'bulk' && renderBulkTab()}
          {activeTab === 'history' && renderHistoryTab()}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage; 