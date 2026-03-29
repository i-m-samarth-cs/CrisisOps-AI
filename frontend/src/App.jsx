import { useState, useEffect, useRef } from 'react';
import { runAgent, getAgentStatus } from './services/api';
import { Activity, MapPin, Plus, AlertTriangle, Shield, Check, Settings, ArrowRight } from 'lucide-react';

function App() {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, running, completed, failed
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [formData, setFormData] = useState({
    location: '',
    crisisType: 'Medical Emergency',
    requirement: ''
  });

  const logsEndRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Polling logic
  useEffect(() => {
    let intervalId;
    if (jobId && status === 'running') {
      intervalId = setInterval(async () => {
        try {
          const res = await getAgentStatus(jobId);
          setStatus(res.status);
          setLogs(res.logs || []);
          if (res.status === 'completed' || res.status === 'failed') {
            clearInterval(intervalId);
            if (res.results) setResults(res.results);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [jobId, status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setStatus('running');
      setLogs([{ message: 'Initializing CrisisOps protocol...' }]);
      setResults([]);
      
      const res = await runAgent(formData);
      setJobId(res.jobId);
    } catch (err) {
      setStatus('failed');
      setLogs(prev => [...prev, { message: 'Failed to connect to Operations API.' }]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 lg:p-12 relative overflow-hidden bg-background">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-danger/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <header className="w-full max-w-7xl flex items-center justify-between mb-10 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-3 rounded-lg border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Shield className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              CrisisOps <span className="text-primary">AI</span>
            </h1>
            <p className="text-gray-400 text-sm tracking-widest uppercase">Autonomous Response Agent</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-full border border-border">
          <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-amber-400 animate-pulse' : status === 'completed' ? 'bg-secondary' : status === 'failed' ? 'bg-danger' : 'bg-gray-500'}`}></div>
          <span className="text-xs font-semibold text-gray-300 uppercase">
            System {status === 'idle' ? 'Standby' : status.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Main Layout */}
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">
        
        {/* Left Column: Input Panel */}
        <section className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface/60 backdrop-blur-md rounded-2xl border border-border p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-gray-400" /> New Operation
            </h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Crisis Type</label>
                <select 
                  className="w-full bg-background border border-border rounded-lg p-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  value={formData.crisisType}
                  onChange={(e) => setFormData({...formData, crisisType: e.target.value})}
                >
                  <option>Medical Emergency</option>
                  <option>Natural Disaster / Flood</option>
                  <option>War Zone / Conflict</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Target Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                  <input 
                    type="text" 
                    required
                    placeholder="City or Coordinates" 
                    className="w-full bg-background border border-border rounded-lg p-3 pl-11 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Specific Requirement</label>
                <div className="relative">
                  <Activity className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. ICU Bed, 50 Blood Units, Shelter" 
                    className="w-full bg-background border border-border rounded-lg p-3 pl-11 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={formData.requirement}
                    onChange={(e) => setFormData({...formData, requirement: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={status === 'running'}
                className="mt-4 w-full bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
              >
                {status === 'running' ? (
                  <><Activity className="w-5 h-5 animate-spin" /> Executing Operation...</>
                ) : (
                  <>Deploy Autonomous Agent <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-surface/40 border border-border rounded-xl p-5 backdrop-blur-sm">
             <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
               <Settings className="w-4 h-4" /> Agent Specifications
             </h3>
             <ul className="text-xs text-gray-500 space-y-2">
               <li className="flex items-center gap-2">• Powered by TinyFish Web Automation</li>
               <li className="flex items-center gap-2">• Asynchronous multi-step execution</li>
               <li className="flex items-center gap-2">• Real-time DOM extraction</li>
             </ul>
          </div>
        </section>

        {/* Right Column: Logs and Results */}
        <section className="col-span-1 lg:col-span-8 flex flex-col gap-6 h-[800px]">
          
          {/* Live Logs Terminal */}
          <div className="flex-1 bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-0 flex flex-col overflow-hidden shadow-2xl relative">
            <div className="bg-black/40 px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-secondary" /> Activity Stream
              </h2>
            </div>
            <div className="flex-1 p-6 overflow-y-auto font-mono text-sm space-y-3">
              {logs.length === 0 ? (
                 <div className="text-gray-600 italic mt-4 text-center">Awaiting mission parameters...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex gap-4 items-start slide-in">
                    <span className="text-gray-500 shrink-0">
                      [{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}]
                    </span>
                    <span className={`${log.message.includes('failed') || log.message.includes('Error') ? 'text-danger' : log.message.includes('success') || log.message.includes('completed') ? 'text-secondary' : 'text-gray-300'}`}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              {status === 'running' && (
                <div className="flex gap-4 items-start animate-pulse">
                  <span className="text-gray-500 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-primary flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200"></div>
                  </span>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Results Panel */}
          {results && results.length > 0 && (
            <div className="bg-surface/80 backdrop-blur-xl border border-secondary/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] slide-up">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Check className="w-6 h-6 text-secondary" /> Extracted Intelligence
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((res, idx) => (
                  <div key={idx} className="bg-background border border-border rounded-xl p-5 hover:border-secondary/50 transition-colors group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white group-hover:text-secondary transition-colors line-clamp-2 pr-2">
                        {res.title || res.name || 'Resource Discovered'}
                      </h3>
                      <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded">
                        Available
                      </span>
                    </div>
                    {res.availability && <p className="text-sm text-gray-300 mb-1">{res.availability}</p>}
                    {res.url && <a href={res.url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline mb-1 block line-clamp-1">{res.url}</a>}
                    {res.location && <p className="text-xs text-gray-500 flex items-center gap-1 mt-3"><MapPin className="w-3 h-3"/> {res.location}</p>}
                    {res.contact && <p className="text-xs text-secondary font-mono mt-1">Contact: {res.contact}</p>}
                    {res.posted && <p className="text-xs text-gray-500 mt-2">Posted: {res.posted}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>
      </main>

      {/* Global CSS for Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        .slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}

export default App;
