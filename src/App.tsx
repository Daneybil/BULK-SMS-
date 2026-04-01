import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Send, 
  Settings, 
  Plus, 
  Search, 
  MoreVertical,
  ArrowUpRight,
  MessageSquare,
  Mail,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// --- Types ---
type Tab = 'dashboard' | 'contacts' | 'campaigns' | 'scraper' | 'devices' | 'settings';

interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline';
  battery: number;
  sentToday: number;
  lastSeen: string;
}

const MOCK_DEVICES: Device[] = [
  { id: 'dev_1', name: 'Samsung S21 (Main)', status: 'online', battery: 85, sentToday: 450, lastSeen: 'Just now' },
  { id: 'dev_2', name: 'Infinix Note 10', status: 'offline', battery: 0, sentToday: 120, lastSeen: '2h ago' },
];

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'active' | 'unsubscribed';
  addedAt: string;
}

interface Campaign {
  id: string;
  name: string;
  type: 'sms' | 'email';
  status: 'sent' | 'scheduled' | 'draft';
  recipients: number;
  sentAt: string;
}

// --- Mock Data ---
const MOCK_STATS = [
  { name: 'Mon', sent: 400, read: 240 },
  { name: 'Tue', sent: 300, read: 139 },
  { name: 'Wed', sent: 200, read: 980 },
  { name: 'Thu', sent: 278, read: 390 },
  { name: 'Fri', sent: 189, read: 480 },
  { name: 'Sat', sent: 239, read: 380 },
  { name: 'Sun', sent: 349, read: 430 },
];

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'John Doe', phone: '+1234567890', email: 'john@example.com', status: 'active', addedAt: '2024-03-20' },
  { id: '2', name: 'Jane Smith', phone: '+1987654321', email: 'jane@example.com', status: 'active', addedAt: '2024-03-21' },
  { id: '3', name: 'Mike Johnson', phone: '+1122334455', email: 'mike@example.com', status: 'unsubscribed', addedAt: '2024-03-22' },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Spring Sale Promotion', type: 'sms', status: 'sent', recipients: 1200, sentAt: '2024-03-25' },
  { id: '2', name: 'Weekly Newsletter', type: 'email', status: 'scheduled', recipients: 850, sentAt: '2024-04-01' },
  { id: '3', name: 'New Product Launch', type: 'sms', status: 'draft', recipients: 0, sentAt: '-' },
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <div 
    className={`sidebar-item ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </div>
);

const StatCard = ({ title, value, change, icon: Icon }: { title: string, value: string, change: string, icon: any }) => (
  <div className="glass-card p-6">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
        <Icon size={20} />
      </div>
      <span className="text-xs font-medium text-green-500 flex items-center gap-1">
        {change} <ArrowUpRight size={12} />
      </span>
    </div>
    <h3 className="text-muted text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [campaignMessage, setCampaignMessage] = useState('');
  const [campaignName, setCampaignName] = useState('');
  
  const TEMPLATES = [
    { name: 'Flash Sale', text: '🔥 FLASH SALE! Get 50% OFF all items today only. Use code SAVE50 at checkout. Shop now: [Link]' },
    { name: 'Welcome', text: 'Welcome to our community! 🌟 We are excited to have you. Reply HELP for more info.' },
    { name: 'Reminder', text: 'Don\'t forget! Your appointment is scheduled for tomorrow. See you then! 👋' },
  ];
  const [targetLink, setTargetLink] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All Countries');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(0);
  const [scrapedNumbers, setScrapedNumbers] = useState<string[]>([]);
  const [scrapingError, setScrapingError] = useState<string | null>(null);

  const handleStartScraping = async () => {
    if (!targetLink) return;
    setIsScraping(true);
    setScrapedNumbers([]);
    setScrapingProgress(10);
    setScrapingError(null);

    try {
      const progressInterval = setInterval(() => {
        setScrapingProgress(prev => (prev < 90 ? prev + 2 : prev));
      }, 200);

      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetLink, countryCode: selectedCountry }),
      });

      clearInterval(progressInterval);
      setScrapingProgress(100);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid response. Please try again later.");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape');
      }

      const data = await response.json();
      setScrapedNumbers(data.numbers);
      
      if (data.numbers.length === 0) {
        setScrapingError("No phone numbers found on this page. Try a different link.");
      }
    } catch (err: any) {
      setScrapingError(err.message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveToContacts = () => {
    // Generate CSV content
    const csvContent = "Phone Number\n" + scrapedNumbers.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `scraped_leads_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Successfully downloaded ${scrapedNumbers.length} numbers as a CSV file to your phone!`);
    setScrapedNumbers([]);
  };

  const handleImport = () => {
    alert("Simulating file import... Processing 150 contacts.");
    setTimeout(() => {
      const newContacts: Contact[] = Array.from({ length: 5 }, (_, i) => ({
        id: `imp_${Date.now()}_${i}`,
        name: `Imported User ${i + 1}`,
        phone: `+234 80${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `user${i + 1}@example.com`,
        status: 'active',
        addedAt: 'Just now',
        lastSeen: 'Just now'
      }));
      setContacts([...newContacts, ...contacts]);
      setIsImportOpen(false);
      alert("Successfully imported 150 contacts!");
    }, 1500);
  };

  const handleLaunchCampaign = () => {
    if (!campaignName || !campaignMessage) {
      alert("Please fill in both campaign name and message.");
      return;
    }

    const newCampaign: Campaign = {
      id: `camp_${Date.now()}`,
      name: campaignName,
      type: 'sms',
      status: 'sent',
      recipients: contacts.length,
      sentAt: 'Just now'
    };

    setCampaigns([newCampaign, ...campaigns]);
    setIsNewCampaignOpen(false);
    setCampaignName('');
    setCampaignMessage('');
    
    // Switch to campaigns tab to show the result
    setActiveTab('campaigns');
    alert("Campaign launched successfully! You can track progress in the Campaigns tab.");
  };

  const handleDownloadAPK = () => {
    alert("Starting APK download... Please ensure you allow installs from unknown sources in your Android settings.");
    // Simulate download
    const link = document.createElement("a");
    link.href = "#";
    link.download = "nexus-gateway.apk";
    link.click();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Modals */}
      <AnimatePresence>
        {isNewCampaignOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsNewCampaignOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-lg p-8 relative z-10"
            >
              <h3 className="text-2xl font-bold mb-6">Create New Campaign</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Campaign Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Summer Flash Sale" 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500" 
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 glass-card border-blue-500/50 flex flex-col items-center gap-2">
                      <MessageSquare className="text-blue-500" />
                      <span className="text-sm font-medium">SMS</span>
                    </button>
                    <button className="p-4 glass-card border-zinc-800 flex flex-col items-center gap-2 opacity-50">
                      <Mail className="text-purple-500" />
                      <span className="text-sm font-medium">Email (Coming Soon)</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Message Content</label>
                    <div className="flex gap-2">
                      {TEMPLATES.map((t) => (
                        <button 
                          key={t.name}
                          onClick={() => setCampaignMessage(t.text)}
                          className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded border border-zinc-700 transition-colors"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea 
                    rows={4} 
                    placeholder="Write your message here..." 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 resize-none"
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                  />
                  <p className="text-[10px] text-muted text-right">{campaignMessage.length} / 160 characters (1 SMS)</p>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  className="flex-1 px-4 py-2 border border-zinc-800 rounded-lg font-medium hover:bg-zinc-900 transition-colors"
                  onClick={() => setIsNewCampaignOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 btn-primary"
                  onClick={handleLaunchCampaign}
                >
                  Launch Campaign
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsImportOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-lg p-8 relative z-10"
            >
              <h3 className="text-2xl font-bold mb-6">Import Contacts</h3>
              <div className="border-2 border-dashed border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                  <Users size={32} className="text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Drag and drop your CSV file</p>
                  <p className="text-sm text-muted mt-1">or click to browse from your computer</p>
                </div>
                <input type="file" className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="btn-primary cursor-pointer mt-2">
                  Select File
                </label>
              </div>
              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg flex gap-3">
                <AlertCircle className="text-blue-500 shrink-0" size={20} />
                <p className="text-xs text-blue-200/80 leading-relaxed">
                  Make sure your CSV has columns for "Name", "Phone", and "Email". Phone numbers should include the country code (e.g., +1).
                </p>
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  className="flex-1 px-4 py-2 border border-zinc-800 rounded-lg font-medium hover:bg-zinc-900 transition-colors"
                  onClick={() => setIsImportOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 btn-primary"
                  onClick={handleImport}
                >
                  Import Now
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isPairingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsPairingOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-md p-8 relative z-10 text-center"
            >
              <h3 className="text-2xl font-bold mb-2">Pair Your Phone</h3>
              <p className="text-muted mb-8">Scan this QR code with the Nexus Gateway app on your Android phone. You only need one phone to start sending messages!</p>
              
              <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto mb-8 flex items-center justify-center">
                {/* Simulated QR Code */}
                <div className="grid grid-cols-4 gap-1 w-full h-full">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-black' : 'bg-zinc-200'}`}></div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-left">
                  <p className="text-[10px] text-muted uppercase font-bold mb-1">Pairing Code</p>
                  <p className="text-xl font-mono font-bold tracking-widest">NX-829-X42</p>
                </div>
                <button 
                  className="w-full px-4 py-3 border border-zinc-800 rounded-lg font-medium hover:bg-zinc-900 transition-colors"
                  onClick={() => setIsPairingOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col gap-8 bg-black">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">NEXUS</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Users} 
            label="Contacts" 
            active={activeTab === 'contacts'} 
            onClick={() => setActiveTab('contacts')} 
          />
          <SidebarItem 
            icon={Search} 
            label="Lead Scraper" 
            active={activeTab === 'scraper'} 
            onClick={() => setActiveTab('scraper')} 
          />
          <SidebarItem 
            icon={Zap} 
            label="Devices" 
            active={activeTab === 'devices'} 
            onClick={() => setActiveTab('devices')} 
          />
          <SidebarItem 
            icon={Send} 
            label="Campaigns" 
            active={activeTab === 'campaigns'} 
            onClick={() => setActiveTab('campaigns')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="glass-card p-4 bg-zinc-900/50">
          <p className="text-xs text-muted mb-2">FREE PLAN</p>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mb-2">
            <div className="bg-blue-600 h-full w-2/3 rounded-full"></div>
          </div>
          <p className="text-[10px] text-muted">650 / 1,000 messages sent</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a]">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold capitalize">{activeTab}</h2>
            <p className="text-muted mt-1">Manage your community growth and messaging.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              className="btn-primary flex items-center gap-2"
              onClick={() => setIsNewCampaignOpen(true)}
            >
              <Plus size={18} />
              <span>New Campaign</span>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'scraper' && (
            <motion.div 
              key="scraper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-card p-8">
                <h3 className="text-2xl font-bold mb-2">Lead Extraction Engine</h3>
                <p className="text-muted mb-8">Paste a link from Telegram, WhatsApp groups, or any website to extract phone numbers.</p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Link</label>
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        placeholder="https://t.me/group_link or https://website.com" 
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                        value={targetLink}
                        onChange={(e) => setTargetLink(e.target.value)}
                      />
                      <button 
                        className={`btn-primary px-8 flex items-center gap-2 ${isScraping ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleStartScraping}
                        disabled={isScraping}
                      >
                        <Zap size={18} className={isScraping ? 'animate-pulse' : ''} />
                        <span>{isScraping ? 'Scraping...' : 'Start Scraping'}</span>
                      </button>
                    </div>
                  </div>

                  {isScraping && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Extracting numbers...</span>
                        <span>{scrapingProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          className="bg-blue-600 h-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${scrapingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filter by Country</label>
                      <select 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 focus:outline-none"
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                      >
                        <option>All Countries</option>
                        <option>Nigeria (+234)</option>
                        <option>United Kingdom (+44)</option>
                        <option>United States (+1)</option>
                        <option>Canada (+1)</option>
                        <option>Germany (+49)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Extraction Depth</label>
                      <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 focus:outline-none">
                        <option>Surface Scan (Fast)</option>
                        <option>Deep Scan (Thorough)</option>
                        <option>Recursive (Follow Links)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                  <span className="text-sm font-medium">Scraped Results ({scrapedNumbers.length})</span>
                  {scrapedNumbers.length > 0 && (
                    <button 
                      className="text-xs text-blue-500 font-bold uppercase tracking-wider hover:underline"
                      onClick={handleSaveToContacts}
                    >
                      Save to Contacts
                    </button>
                  )}
                </div>
                {scrapedNumbers.length > 0 ? (
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {scrapedNumbers.map((num, i) => (
                      <div key={i} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-center font-mono text-sm">
                        {num}
                      </div>
                    ))}
                  </div>
                ) : scrapingError ? (
                  <div className="p-12 text-center text-red-400">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <p>{scrapingError}</p>
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted">
                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No numbers extracted yet. Paste a link above to begin.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'devices' && (
            <motion.div 
              key="devices"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold">Android Gateways</h3>
                  <p className="text-muted mt-1">Connect your mobile phones to send SMS directly from your SIM plans.</p>
                </div>
                <button 
                  className="btn-primary flex items-center gap-2"
                  onClick={() => setIsPairingOpen(true)}
                >
                  <Plus size={18} />
                  <span>Add New Device</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {devices.map((device) => (
                  <div key={device.id} className="glass-card p-6 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-zinc-900 rounded-xl">
                          <Zap size={24} className={device.status === 'online' ? 'text-blue-500' : 'text-muted'} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{device.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="text-xs text-muted uppercase font-bold tracking-wider">{device.status}</span>
                          </div>
                        </div>
                      </div>
                      <button className="text-muted hover:text-white"><MoreVertical size={20} /></button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-zinc-900/50 rounded-lg">
                        <p className="text-[10px] text-muted uppercase font-bold">Battery</p>
                        <p className="text-lg font-bold">{device.battery}%</p>
                      </div>
                      <div className="p-3 bg-zinc-900/50 rounded-lg">
                        <p className="text-[10px] text-muted uppercase font-bold">Sent Today</p>
                        <p className="text-lg font-bold">{device.sentToday}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted">
                      <span>Last seen: {device.lastSeen}</span>
                      <span className="font-mono text-blue-500">ID: {device.id}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card p-8 bg-blue-500/5 border-blue-500/20 flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                  <Zap size={32} className="text-white fill-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold">Download Android Gateway App</h4>
                  <p className="text-muted mt-1">Install our APK on your Android phone to turn it into a professional SMS gateway.</p>
                </div>
                <button 
                  className="btn-primary flex items-center gap-2 whitespace-nowrap"
                  onClick={handleDownloadAPK}
                >
                  <Plus size={18} />
                  <span>Download APK</span>
                </button>
              </div>
            </motion.div>
          )}
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Contacts" value={contacts.length.toLocaleString()} change="+12%" icon={Users} />
                <StatCard title="Messages Sent" value="8,420" change="+18%" icon={Send} />
                <StatCard title="Open Rate" value="94.2%" change="+2.4%" icon={CheckCircle2} />
                <StatCard title="Active Campaigns" value={campaigns.filter(c => c.status === 'sent').length.toString()} change="0%" icon={Zap} />
              </div>

              {/* Chart Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Engagement Overview</h3>
                    <select className="bg-zinc-900 border border-zinc-800 rounded-md text-xs px-2 py-1">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                    </select>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={MOCK_STATS}>
                        <defs>
                          <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#141414', border: '1px solid #27272a', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="sent" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSent)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="font-bold text-lg mb-6">Recent Activity</h3>
                  <div className="space-y-6">
                    {[
                      { icon: MessageSquare, text: 'SMS Campaign "Spring Sale" sent', time: '2h ago', color: 'text-blue-500' },
                      { icon: Users, text: '12 new contacts imported', time: '5h ago', color: 'text-green-500' },
                      { icon: Mail, text: 'Newsletter draft created', time: '1d ago', color: 'text-purple-500' },
                      { icon: AlertCircle, text: 'Twilio API key updated', time: '2d ago', color: 'text-orange-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className={`p-2 bg-zinc-900 rounded-lg ${item.color}`}>
                          <item.icon size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.text}</p>
                          <p className="text-xs text-muted mt-1">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'contacts' && (
            <motion.div 
              key="contacts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-lg">Contact List</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs font-medium hover:bg-zinc-800 transition-colors">
                    Export CSV
                  </button>
                  <button 
                    className="px-3 py-1.5 bg-blue-600 rounded-md text-xs font-medium hover:bg-blue-500 transition-colors"
                    onClick={() => setIsImportOpen(true)}
                  >
                    Import Contacts
                  </button>
                </div>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-900/50 text-muted text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Phone</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Added</th>
                    <th className="px-6 py-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium">{contact.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">{contact.phone}</td>
                      <td className="px-6 py-4 text-sm text-muted">{contact.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          contact.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">{contact.addedAt}</td>
                      <td className="px-6 py-4">
                        <button className="text-muted hover:text-white transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'campaigns' && (
            <motion.div 
              key="campaigns"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="glass-card p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${campaign.type === 'sms' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                      {campaign.type === 'sms' ? <MessageSquare size={20} /> : <Mail size={20} />}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      campaign.status === 'sent' ? 'bg-green-500/10 text-green-500' : 
                      campaign.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' : 
                      'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{campaign.name}</h4>
                    <p className="text-sm text-muted mt-1">{campaign.recipients.toLocaleString()} recipients</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Clock size={14} />
                      <span>{campaign.sentAt}</span>
                    </div>
                    <button className="text-sm font-medium text-blue-500 hover:underline">View Details</button>
                  </div>
                </div>
              ))}
              <button 
                className="glass-card p-6 border-dashed border-2 border-zinc-800 flex flex-col items-center justify-center gap-3 text-muted hover:text-white hover:border-zinc-600 transition-all group"
                onClick={() => setIsNewCampaignOpen(true)}
              >
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <span className="font-medium">Create New Campaign</span>
              </button>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl space-y-8"
            >
              <div className="glass-card p-8 space-y-6">
                <h3 className="text-xl font-bold">API Configuration</h3>
                <p className="text-sm text-muted">Connect your messaging providers to start sending campaigns.</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Twilio Account SID</label>
                    <input 
                      type="password" 
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Twilio Auth Token</label>
                    <input 
                      type="password" 
                      placeholder="••••••••••••••••••••••••••••••••" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Twilio Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="+1234567890" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <button className="btn-primary w-full mt-4">Save Configuration</button>
              </div>

              <div className="glass-card p-8 border-red-500/20">
                <h3 className="text-xl font-bold text-red-500">Danger Zone</h3>
                <p className="text-sm text-muted mt-2">Irreversible actions for your account.</p>
                <button className="mt-6 px-4 py-2 border border-red-500/50 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/10 transition-colors">
                  Delete All Data
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
