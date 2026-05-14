import { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Terminal, 
  Activity, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Hash,
  FileText,
  MousePointer2,
  Cpu,
  Monitor,
  Settings,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---
interface PrintJob {
  id: string;
  filename: string;
  pages: number;
  status: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED';
  progress: number;
  timestamp: string;
  inkEstimate?: string;
}

type Tab = 'summary' | 'printers' | 'queue' | 'logs' | 'deploy';

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 text-sm font-mono transition-all duration-200 group",
      active ? "bg-[#333] text-[#ff6b00] border-r-2 border-[#ff6b00]" : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
    )}
  >
    <Icon size={18} className={cn("transition-transform group-hover:scale-110", active && "text-[#ff6b00]")} />
    <span>{label}</span>
  </button>
);

const TerminalLog = ({ logs }: { logs: string[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-black/80 rounded-sm border border-[#333] p-4 font-mono text-xs h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#444]" ref={scrollRef}>
      {logs.map((log, i) => (
        <div key={i} className="mb-1">
          <span className="text-[#33ff33]">root@printflow-lxc:</span>
          <span className="text-[#888] ml-2">~#</span>
          <span className="text-white ml-2 opacity-90">{log}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 text-[#33ff33] mt-2">
        <span>root@printflow-lxc:</span>
        <span className="text-[#888]">~#</span>
        <span className="w-2 h-4 bg-[#33ff33] animate-pulse"></span>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [systemStats, setSystemStats] = useState({ cpu: 0, ram: 0, swap: 0 });

  // Poll for updates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, logsRes] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/logs')
        ]);
        const j = await jobsRes.json();
        const l = await logsRes.json();
        setJobs(j);
        setLogs(l);
      } catch (err) {
        console.error("Fetch error", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);

    // Fake system stats animation
    const statsInterval = setInterval(() => {
      setSystemStats({
        cpu: Math.floor(Math.random() * 15) + 2,
        ram: 42,
        swap: 2
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(statsInterval);
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetch('/api/print', {
        method: 'POST',
        body: formData
      });
      // Refresh will happen via polling
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const clearJobs = async () => {
    await fetch('/api/jobs/clear', { method: 'POST' });
  };

  return (
    <div className="flex h-screen bg-[#1c1c1c] text-white selection:bg-[#ff6b00] selection:text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#121212] border-r border-[#2a2a2a] flex flex-col">
        <div className="p-6 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#ff6b00] rounded-sm flex items-center justify-center">
              <Printer size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">PrintFlow LXC</h1>
              <span className="text-[10px] font-mono text-[#ff6b00] uppercase tracking-widest">Node: datacenter-1</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 mt-4">
          <div className="px-4 py-2 text-[10px] text-gray-600 font-mono uppercase tracking-widest">Resources</div>
          <SidebarItem icon={Activity} label="Summary" active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} />
          <SidebarItem icon={FileText} label="Queue" active={activeTab === 'queue'} onClick={() => setActiveTab('queue')} />
          <SidebarItem icon={Printer} label="Printers" active={activeTab === 'printers'} onClick={() => setActiveTab('printers')} />
          
          <div className="px-4 py-2 mt-6 text-[10px] text-gray-600 font-mono uppercase tracking-widest">Logs & Debug</div>
          <SidebarItem icon={Terminal} label="System Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
          <SidebarItem icon={Upload} label="Deploy to PVE" active={activeTab === 'deploy'} onClick={() => setActiveTab('deploy')} />
          <SidebarItem icon={Settings} label="LXC Settings" active={false} onClick={() => {}} />
        </nav>

        <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Uptime</span>
            <span className="text-[10px] font-mono text-gray-300">12d 4h 32m</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1">
                <span>CPU Usage</span>
                <span>{systemStats.cpu}%</span>
              </div>
              <div className="w-full h-1 bg-[#333] rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${systemStats.cpu}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1">
                <span>RAM Usage</span>
                <span>{systemStats.ram}%</span>
              </div>
              <div className="w-full h-1 bg-[#333] rounded-full overflow-hidden">
                <div className="h-full bg-[#ff6b00] transition-all duration-1000" style={{ width: `${systemStats.ram}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#1c1c1c] flex flex-col relative">
        <header className="h-16 border-b border-[#2a2a2a] bg-[#1c1c1c] flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#888]">
            <Monitor size={16} />
            <span>Datacenter</span>
            <ChevronRight size={14} />
            <Hash size={14} />
            <span className="text-white font-medium">101 (printflow-lxc)</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-mono text-green-500">RUNNING</span>
            </div>
            <button className="px-3 py-1 bg-[#333] hover:bg-[#444] text-[11px] font-mono rounded-sm border border-[#444] transition-colors">
              Reboot Container
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl">
          <AnimatePresence mode="wait">
            {activeTab === 'summary' && (
              <motion.div 
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total Jobs', val: jobs.length, icon: FileText, color: 'text-blue-400' },
                    { label: 'Completed', val: jobs.filter(j => j.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-green-400' },
                    { label: 'In Progress', val: jobs.filter(j => j.status === 'PRINTING').length, icon: Loader2, color: 'text-[#ff6b00]', animate: true },
                    { label: 'System Health', val: 'Excellent', icon: Activity, color: 'text-emerald-400' },
                  ].map((s, idx) => (
                    <div key={idx} className="bg-[#121212] border border-[#2a2a2a] p-5 rounded-sm group hover:border-[#444] transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <s.icon size={20} className={cn(s.color, s.animate && "animate-spin")} />
                        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Metric {idx + 1}</span>
                      </div>
                      <div className="text-2xl font-mono mb-1">{s.val}</div>
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-tight">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* Upload Section */}
                  <div className="bg-[#121212] border border-[#2a2a2a] rounded-sm flex flex-col h-full">
                    <div className="p-4 border-b border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                         <Upload size={14} className="text-[#ff6b00]" />
                         Submit Print Job
                      </h3>
                    </div>
                    <div className="p-10 flex flex-col items-center justify-center flex-1 space-y-4">
                      <input 
                        type="file" 
                        id="fileInput" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                        disabled={isUploading}
                      />
                      <label 
                        htmlFor="fileInput"
                        className={cn(
                          "w-full h-48 border-2 border-dashed border-[#333] rounded-md flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[#1a1a1a] hover:border-[#ff6b00]/50 group",
                          isUploading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          {isUploading ? <Loader2 className="animate-spin text-[#ff6b00]" /> : <Upload className="text-[#888] group-hover:text-[#ff6b00]" />}
                        </div>
                        <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                        <p className="text-[10px] text-gray-600 font-mono mt-1">PDF, PNG, JPG (MAX. 10MB)</p>
                      </label>
                      <p className="text-[10px] text-gray-500 italic text-center px-4">
                        System automatically estimates pages and ink intensity for accurate queue prioritization.
                      </p>
                    </div>
                  </div>

                  {/* Terminal Summary */}
                  <div className="bg-[#121212] border border-[#2a2a2a] rounded-sm flex flex-col h-full">
                    <div className="p-4 border-b border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                         <Terminal size={14} className="text-[#33ff33]" />
                         Recent System Activity
                      </h3>
                    </div>
                    <div className="p-4 flex-1">
                      <TerminalLog logs={logs.slice(-10)} />
                    </div>
                  </div>
                </div>

                {/* Mini Queue Table */}
                <div className="bg-[#121212] border border-[#2a2a2a] rounded-sm">
                   <div className="p-4 border-b border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-between">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Active Processing Queue</h3>
                      <button onClick={clearJobs} className="text-[10px] text-[#ff6b00] hover:underline uppercase font-bold tracking-widest">Clear Finished</button>
                   </div>
                   <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-[#1a1a1a] text-gray-500 uppercase">
                        <tr>
                          <th className="px-6 py-3 font-medium">Job ID</th>
                          <th className="px-6 py-3 font-medium">Filename</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium">Progress</th>
                          <th className="px-6 py-3 font-medium">Ink Intensity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-600">No active print jobs in queue.</td></tr>
                        ) : (
                          jobs.slice(0, 5).map((job) => (
                            <tr key={job.id} className="border-t border-[#222] hover:bg-[#1a1a1a] transition-colors">
                              <td className="px-6 py-4 text-[#888]">#{job.id}</td>
                              <td className="px-6 py-4 font-sans font-medium">{job.filename}</td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase",
                                  job.status === 'COMPLETED' && "bg-green-500/10 text-green-500",
                                  job.status === 'PRINTING' && "bg-[#ff6b00]/10 text-[#ff6b00]",
                                  job.status === 'PENDING' && "bg-gray-500/10 text-gray-500"
                                )}>
                                  {job.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 w-48">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#ff6b00] transition-all duration-500" style={{ width: `${job.progress}%` }}></div>
                                  </div>
                                  <span>{job.progress}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1">
                                  <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    job.inkEstimate === 'Low' ? "bg-green-500" : job.inkEstimate === 'Medium' ? "bg-yellow-500" : "bg-red-500"
                                  )}></span>
                                  <span className="text-[10px] text-gray-400">{job.inkEstimate || 'N/A'}</span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'queue' && (
               <motion.div 
               key="queue"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="bg-[#121212] border border-[#2a2a2a] rounded-sm"
             >
                {/* Full Queue Table Content */}
                <div className="p-6 border-b border-[#2a2a2a] bg-[#1a1a1a] flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-3">
                    <FileText className="text-[#ff6b00]" />
                    Print Job Management
                  </h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#ff6b00] hover:bg-[#e65a00] text-sm font-bold rounded-sm transition-colors shadow-lg">
                    <Printer size={16} />
                    Force Print All
                  </button>
                </div>
                <div className="p-0">
                  <table className="w-full text-left font-mono text-sm">
                    <thead className="bg-[#1a1a1a] text-gray-500 uppercase text-[11px] tracking-widest border-b border-[#2a2a2a]">
                      <tr>
                        <th className="px-8 py-4 font-medium">Job ID</th>
                        <th className="px-8 py-4 font-medium">File Context</th>
                        <th className="px-8 py-4 font-medium">Lifecycle</th>
                        <th className="px-8 py-4 font-medium">Pages</th>
                        <th className="px-8 py-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id} className="border-b border-[#222] hover:bg-[#1a1a1a]/50">
                          <td className="px-8 py-5">
                            <span className="text-[#ff6b00] font-bold">LXC-{job.id}</span>
                          </td>
                          <td className="px-8 py-5 font-sans">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-200">{job.filename}</span>
                              <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <Clock size={10} /> Submitted {new Date(job.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              {job.status === 'COMPLETED' ? <CheckCircle2 size={16} className="text-green-500" /> : <Loader2 size={16} className="text-[#ff6b00] animate-spin" />}
                              <span className="text-xs uppercase font-bold tracking-tighter">{job.status}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">{job.pages} pgs</td>
                          <td className="px-8 py-5 text-right">
                            <button className="p-2 text-gray-600 hover:text-red-400 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="bg-[#121212] border border-[#2a2a2a] rounded-sm flex flex-col h-[600px]"
              >
                <div className="p-4 border-b border-[#2a2a2a] bg-[#1a1a1a] flex justify-between items-center">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#33ff33]">CONSOLE @ printflow-lxc</span>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40"></div>
                  </div>
                </div>
                <div className="p-2 flex-1 flex flex-col">
                  <TerminalLog logs={logs} />
                </div>
                <div className="p-2 bg-black border-t border-[#333] flex items-center gap-3 px-4 h-12">
                   <span className="text-[#33ff33] font-mono text-xs">root@printflow-lxc:~#</span>
                   <input 
                    type="text" 
                    placeholder="Type command (reboot, clear, cups status)..." 
                    className="bg-transparent border-none focus:outline-none text-xs font-mono flex-1 text-white placeholder-gray-700"
                   />
                </div>
              </motion.div>
            )}

            {activeTab === 'deploy' && (
              <motion.div 
                key="deploy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-[#121212] border border-[#ff6b00]/30 rounded-sm p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#ff6b00]/10 rounded-full flex items-center justify-center mb-6 border border-[#ff6b00]/20">
                    <Upload size={32} className="text-[#ff6b00]" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Proxmox One-Line Installer</h2>
                  <p className="text-gray-400 max-w-lg mb-8 leading-relaxed">
                    Deploy this entire print server LXC to your Proxmox Host in seconds. 
                    This script automates container creation, Node.js installation, and network setup.
                  </p>

                  <div className="w-full max-w-3xl bg-black rounded-md border border-[#333] p-6 text-left font-mono">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Execute on Proxmox Shell</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(`bash -c "$(wget -qLO - ${window.location.origin}/proxmox_install.sh)"`)}
                        className="text-[10px] text-[#ff6b00] hover:underline"
                      >
                        Copy Command
                      </button>
                    </div>
                    <div className="text-sm break-all text-[#33ff33] leading-loose">
                      bash -c "$(wget -qLO - {window.location.origin}/proxmox_install.sh)"
                    </div>
                  </div>

                  <div className="mt-12 grid grid-cols-3 gap-6 w-full text-left">
                    <div className="bg-[#1a1a1a] p-4 border border-[#333] rounded-sm">
                      <div className="text-[#ff6b00] mb-2 font-bold text-xs uppercase">Step 1</div>
                      <p className="text-[11px] text-gray-500">Open your Proxmox Host shell via the web interface or SSH.</p>
                    </div>
                    <div className="bg-[#1a1a1a] p-4 border border-[#333] rounded-sm">
                      <div className="text-[#ff6b00] mb-2 font-bold text-xs uppercase">Step 2</div>
                      <p className="text-[11px] text-gray-500">Paste and run the one-line command shown above.</p>
                    </div>
                    <div className="bg-[#1a1a1a] p-4 border border-[#333] rounded-sm">
                      <div className="text-[#ff6b00] mb-2 font-bold text-xs uppercase">Step 3</div>
                      <p className="text-[11px] text-gray-500">Follow the prompts to confirm IDs and Hostnames.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-6 rounded-sm">
                   <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Settings size={14} className="text-gray-400" />
                     Installer Defaults
                   </h3>
                   <div className="grid grid-cols-2 gap-y-2 text-[11px] font-mono">
                      <div className="text-gray-500">LXC OS Template:</div><div className="text-gray-300">Debian 12 (latest)</div>
                      <div className="text-gray-500">Default Resources:</div><div className="text-gray-300">512MB RAM / 1 Core / 4GB Disk</div>
                      <div className="text-gray-500">Network stack:</div><div className="text-gray-300">DHCP / vmbr0 Bridge</div>
                      <div className="text-gray-500">Node Runtime:</div><div className="text-gray-300">v20.x (LTS)</div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Connection Toast */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-[#121212] border border-[#ff6b00]/30 shadow-2xl px-4 py-3 rounded-sm flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
           <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
           <div>
             <div className="text-[10px] font-mono font-bold text-[#ff6b00] uppercase tracking-widest leading-none">Socket Connected</div>
             <div className="text-[9px] text-gray-500 font-mono mt-0.5">TLS 1.3 / OpenSSL 3.0.x</div>
           </div>
        </div>
      </div>
    </div>
  );
}
