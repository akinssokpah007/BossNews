import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Mail, 
  Send, 
  Inbox, 
  Trash2, 
  RefreshCw, 
  Search, 
  Plus, 
  CornerUpLeft, 
  Loader2, 
  Check, 
  AlertCircle,
  X,
  Star,
  FileText
} from 'lucide-react';

interface EmailHeader {
  name: string;
  value: string;
}

interface EmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  labelIds: string[];
  payload: {
    headers: EmailHeader[];
    body?: {
      size: number;
      data?: string;
    };
    parts?: any[];
  };
  // Parsed fields
  subject?: string;
  from?: string;
  date?: string;
  bodyText?: string;
}

const getHeader = (headers: EmailHeader[] | undefined, name: string): string => {
  if (!headers) return '';
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
};

const decodeBase64 = (data: string): string => {
  if (!data) return '';
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (error) {
    console.error('Base64 decode error:', error);
    return 'Content could not be decoded.';
  }
};

const parseEmailBody = (payload: any): string => {
  if (!payload) return '';
  if (payload.body && payload.body.data) {
    return decodeBase64(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        return decodeBase64(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return decodeBase64(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.parts) {
        const body = parseEmailBody(part);
        if (body) return body;
      }
    }
  }
  return '';
};

export default function GmailHub() {
  const { user, gmailToken, connectGmail } = useAuth();
  
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [activeFolder, setActiveFolder] = useState<'INBOX' | 'SENT' | 'DRAFT' | 'TRASH'>('INBOX');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Load emails
  const fetchEmails = async (tokenToUse: string = gmailToken || '') => {
    if (!tokenToUse) return;
    setLoading(true);
    setError(null);
    try {
      // 1. List messages
      let url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15';
      
      // Filter by active folder label
      if (activeFolder === 'SENT') {
        url += '&q=label:SENT';
      } else if (activeFolder === 'DRAFT') {
        url += '&q=label:DRAFT';
      } else if (activeFolder === 'TRASH') {
        url += '&q=label:TRASH';
      } else {
        url += '&q=label:INBOX';
      }

      if (searchQuery.trim()) {
        url += ` ${encodeURIComponent(searchQuery.trim())}`;
      }

      const listRes = await fetch(url, {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });

      if (!listRes.ok) {
        throw new Error(`Failed to list emails: ${listRes.statusText}`);
      }

      const listData = await listRes.json();
      
      if (!listData.messages || listData.messages.length === 0) {
        setEmails([]);
        setLoading(false);
        return;
      }

      // 2. Fetch full details for the top 15 emails in parallel
      const detailPromises = listData.messages.map(async (msg: { id: string }) => {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${tokenToUse}` },
        });
        if (!detailRes.ok) return null;
        
        const detailData = await detailRes.json();
        
        // Parse email info
        const headers = detailData.payload?.headers || [];
        const subject = getHeader(headers, 'subject') || '(No Subject)';
        const from = getHeader(headers, 'from') || 'Unknown';
        const date = getHeader(headers, 'date') || '';
        const bodyText = parseEmailBody(detailData.payload);

        return {
          ...detailData,
          subject,
          from,
          date,
          bodyText
        } as EmailMessage;
      });

      const detailedEmails = await Promise.all(detailPromises);
      const filteredEmails = detailedEmails.filter((email): email is EmailMessage => email !== null);
      setEmails(filteredEmails);
    } catch (err: any) {
      console.error('Fetch emails error:', err);
      setError(err.message || 'Error occurred while loading emails.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when folder or token changes
  useEffect(() => {
    if (gmailToken) {
      fetchEmails();
    }
  }, [gmailToken, activeFolder]);

  const handleConnect = async () => {
    try {
      setError(null);
      const token = await connectGmail();
      await fetchEmails(token);
    } catch (err: any) {
      setError(err.message || 'Could not connect to Gmail.');
    }
  };

  // Delete message (Move to Trash)
  const handleDeleteEmail = async (id: string) => {
    if (!gmailToken) return;
    const confirmed = window.confirm('Are you sure you want to move this email to Trash?');
    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) {
        throw new Error('Failed to trash email');
      }

      // Deselect and reload
      setSelectedEmail(null);
      await fetchEmails();
    } catch (err: any) {
      alert(`Error trashing email: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Mark unread / read (Modify label IDs)
  const handleToggleUnread = async (email: EmailMessage) => {
    if (!gmailToken) return;
    const isUnread = email.labelIds.includes('UNREAD');
    
    try {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}/modify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          removeLabelIds: isUnread ? ['UNREAD'] : [],
          addLabelIds: isUnread ? [] : ['UNREAD']
        })
      });

      if (!res.ok) {
        throw new Error('Failed to change unread status');
      }

      // Update local state
      const updatedEmails = emails.map(e => {
        if (e.id === email.id) {
          const newLabels = isUnread 
            ? e.labelIds.filter(l => l !== 'UNREAD')
            : [...e.labelIds, 'UNREAD'];
          return { ...e, labelIds: newLabels };
        }
        return e;
      });
      setEmails(updatedEmails);
      
      if (selectedEmail?.id === email.id) {
        const newLabels = isUnread 
          ? selectedEmail.labelIds.filter(l => l !== 'UNREAD')
          : [...selectedEmail.labelIds, 'UNREAD'];
        setSelectedEmail({ ...selectedEmail, labelIds: newLabels });
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Helper to construct base64 raw email and send
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailToken) return;

    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      alert('Please fill in all the fields (To, Subject, Message).');
      return;
    }

    // Explicit confirmation dialouge as mandated by workspace-integration guidelines
    const confirmed = window.confirm(`Confirm: Send this email to ${composeTo}?`);
    if (!confirmed) return;

    setSending(true);
    setSendSuccess(false);

    try {
      // Build RFC 2822 email format
      const formattedTo = composeTo.trim();
      const formattedSubject = composeSubject.trim();
      const str = [
        `To: ${formattedTo}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${formattedSubject}`,
        '',
        composeBody.replace(/\n/g, '<br/>'),
      ].join('\r\n');
      
      const utf8Bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      const base64Raw = btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: base64Raw })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to send message via Gmail API.');
      }

      setSendSuccess(true);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      
      // Auto-hide modal and refresh inbox
      setTimeout(() => {
        setShowCompose(false);
        setSendSuccess(false);
        fetchEmails();
      }, 1500);

    } catch (err: any) {
      alert(`Error sending email: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // Reply trigger
  const handleReply = (email: EmailMessage) => {
    setComposeTo(email.from || '');
    setComposeSubject(`Re: ${email.subject}`);
    setComposeBody(`\n\nOn ${email.date}, ${email.from} wrote:\n> ${email.snippet}`);
    setShowCompose(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-colors duration-300">
      
      {/* Header */}
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center justify-center md:justify-start gap-3">
            <Mail className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            BossNews <span className="text-violet-600 dark:text-violet-400">Gmail Desk</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            Securely compose briefings, dispatch releases, and manage editor correspondence inside your Google Workspace.
          </p>
        </div>
        
        {gmailToken && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white font-bold text-sm rounded-full shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4.5 h-4.5" />
              Compose Briefing
            </button>
            <button 
              onClick={() => fetchEmails()}
              disabled={loading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full transition-all disabled:opacity-50"
              title="Refresh Mailbox"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Authentication or Connection Issue</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Auth state screen */}
      {!gmailToken ? (
        <div className="max-w-xl mx-auto py-16 px-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-xl space-y-6">
          <div className="w-16 h-16 bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Mail className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
              Connect Google Workspace
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
              Authorize the BossNews secure applet to access your Gmail messages and drafts. You can manage coverage communication directly.
            </p>
          </div>

          <button
            onClick={handleConnect}
            className="gsi-material-button mx-auto py-3 px-5 transition-transform hover:scale-[1.02] active:scale-95"
            style={{ display: 'inline-flex' }}
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents font-bold">Sign in with Google</span>
            </div>
          </button>
        </div>
      ) : (
        /* Authenticated Gmail Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Folders & Navigation Side Column (4 cols on lg, full on mobile) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Search Mail */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchEmails();
                }}
                className="w-full px-4 py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Mailbox Folders
                </span>
              </div>
              <nav className="p-2 space-y-1">
                <button
                  onClick={() => { setActiveFolder('INBOX'); setSelectedEmail(null); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeFolder === 'INBOX' 
                      ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="w-4.5 h-4.5" />
                    <span>Inbox</span>
                  </div>
                </button>
                
                <button
                  onClick={() => { setActiveFolder('SENT'); setSelectedEmail(null); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeFolder === 'SENT' 
                      ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Send className="w-4.5 h-4.5" />
                    <span>Sent Briefings</span>
                  </div>
                </button>
                
                <button
                  onClick={() => { setActiveFolder('TRASH'); setSelectedEmail(null); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeFolder === 'TRASH' 
                      ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-4.5 h-4.5" />
                    <span>Trash</span>
                  </div>
                </button>
              </nav>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Live Session Details
              </h5>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Logged in as: <span className="font-bold text-slate-800 dark:text-slate-200">{user?.email}</span>
              </p>
            </div>

          </div>

          {/* Inbox List & Reader Main Layout (9 cols on lg) */}
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Email List Panel (5 cols on md) */}
            <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[600px]">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {activeFolder} • {emails.length} Messages
                </span>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                {emails.length === 0 ? (
                  <div className="p-8 text-center space-y-2 mt-12">
                    <Mail className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No messages found</p>
                    <p className="text-xs text-slate-400">Try checking another folder or search.</p>
                  </div>
                ) : (
                  emails.map((email) => {
                    const isUnread = email.labelIds.includes('UNREAD');
                    const isSelected = selectedEmail?.id === email.id;
                    return (
                      <div
                        key={email.id}
                        onClick={() => setSelectedEmail(email)}
                        className={`p-4 cursor-pointer hover:bg-slate-50/55 dark:hover:bg-slate-850/50 transition-all text-left relative ${
                          isSelected ? 'bg-slate-50 dark:bg-slate-850/30' : ''
                        }`}
                      >
                        {isUnread && (
                          <div className="absolute left-2.5 top-[22px] w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400" />
                        )}
                        <div className="pl-3 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs truncate max-w-[120px] ${isUnread ? 'font-black text-slate-900 dark:text-white' : 'font-medium text-slate-500'}`}>
                              {email.from?.split('<')[0]?.trim()}
                            </span>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {email.date ? new Date(email.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {email.subject}
                          </p>
                          <p className="text-xs text-slate-400 truncate line-clamp-1">
                            {email.snippet}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Email Reading Panel (7 cols on md) */}
            <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[600px]">
              {selectedEmail ? (
                <div className="flex flex-col h-full">
                  {/* Subject, sender, actions header */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 space-y-4 text-left">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                        {selectedEmail.subject}
                      </h2>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleToggleUnread(selectedEmail)}
                          className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition-all"
                          title={selectedEmail.labelIds.includes('UNREAD') ? "Mark Read" : "Mark Unread"}
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmail(selectedEmail.id)}
                          className="p-2 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-800 transition-all"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          From: <span className="font-normal text-slate-500 dark:text-slate-400">{selectedEmail.from}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Date: <span className="font-normal text-slate-500 dark:text-slate-400">{selectedEmail.date}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="flex-1 p-6 overflow-y-auto text-left dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed border-b border-slate-100 dark:border-slate-800">
                    {selectedEmail.bodyText ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.bodyText }} className="email-body-html" />
                    ) : (
                      <p className="text-slate-700 dark:text-slate-300">{selectedEmail.snippet}</p>
                    )}
                  </div>

                  {/* Reply actions footer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-end">
                    <button
                      onClick={() => handleReply(selectedEmail)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 dark:hover:bg-violet-600 text-white font-bold text-xs rounded-full shadow-lg shadow-violet-500/10 active:scale-95 transition-all"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                      Reply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="m-auto text-center space-y-3 p-8">
                  <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto" />
                  <h4 className="text-base font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-tight">No Briefing Selected</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Select any dispatch or communication from the list panel to view details and draft correspondences.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Compose Briefing Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                New Coverage Briefing
              </span>
              <button 
                onClick={() => setShowCompose(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compose Form */}
            <form onSubmit={handleSendEmail} className="p-6 space-y-4 text-left flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  To (Recipient Email)
                </label>
                <input
                  type="email"
                  required
                  placeholder="editor@bossnews.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="Breaking: Strategic Liberia Trade Corridor Developments"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Message Content
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="Enter details of your dispatch here..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white font-sans leading-relaxed resize-none"
                />
              </div>

              {sendSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl text-green-600 dark:text-green-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>Briefing dispatched successfully via Gmail! Closing desk...</span>
                </div>
              )}

              {/* Form Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="px-5 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || sendSuccess}
                  className="flex items-center gap-2 px-6 py-2 bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 dark:hover:bg-violet-600 text-white font-bold text-sm rounded-full shadow-lg shadow-violet-500/20 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Dispatch Briefing
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

// Inline fallback icon in case BookOpen isn't default
function BookOpen({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
