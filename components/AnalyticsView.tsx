
import React, { useState, useMemo } from 'react';
import { MOCK_REPORTS, ANALYTICS_CHART_DATA } from '../constants';
import { ReportEntry, SensorStatus, ChartData } from '../types';
import { Download, Filter, Calendar, FileText, ChevronDown, Printer, Search, ArrowUpDown, CheckCircle, AlertCircle, AlertTriangle, PieChart, TrendingUp, BarChart2, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsViewProps {
  activeMFY?: string; 
}

// Custom SVG Line Chart Component
const SVGLineChart = ({ data, color }: { data: any[], color: string }) => {
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 300},${100 - (d.value / 100) * 100}`).join(' ');
    const predictedPoints = data.filter(d => d.predicted).map((d, i) => {
        // Find index relative to full array
        const realIndex = data.findIndex(x => x.label === d.label);
        return `${(realIndex / (data.length - 1)) * 300},${100 - (d.predicted / 100) * 100}`;
    }).join(' ');
    
    // Connect last real point to first predicted
    const lastReal = data.filter(d => d.predicted === undefined).pop();
    const firstPred = data.filter(d => d.predicted !== undefined)[0];
    let connection = "";
    if (lastReal && firstPred) {
        const idx1 = data.findIndex(x => x.label === lastReal.label);
        const idx2 = data.findIndex(x => x.label === firstPred.label);
        connection = `${(idx1 / (data.length - 1)) * 300},${100 - (lastReal.value / 100) * 100} ${(idx2 / (data.length - 1)) * 300},${100 - (firstPred.predicted / 100) * 100}`;
    }

    return (
        <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
            {/* Grid */}
            <line x1="0" y1="0" x2="300" y2="0" stroke="#e2e8f0" strokeDasharray="4"/>
            <line x1="0" y1="50" x2="300" y2="50" stroke="#e2e8f0" strokeDasharray="4"/>
            <line x1="0" y1="100" x2="300" y2="100" stroke="#e2e8f0" strokeDasharray="4"/>
            {/* Real Data */}
            <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Predicted Data */}
            {predictedPoints && <polyline points={predictedPoints} fill="none" stroke={color} strokeWidth="3" strokeDasharray="6" strokeOpacity="0.6"/>}
            {connection && <polyline points={connection} fill="none" stroke={color} strokeWidth="3" strokeDasharray="6" strokeOpacity="0.6" />}
            
            {/* Dots */}
            {data.map((d, i) => (
                <circle key={i} cx={(i / (data.length - 1)) * 300} cy={100 - ((d.predicted || d.value) / 100) * 100} r="4" fill="white" stroke={color} strokeWidth="2" />
            ))}
        </svg>
    );
};

// Custom SVG Bar Chart Component
const SVGBarChart = ({ data, color }: { data: any[], color: string }) => {
    return (
        <svg viewBox="0 0 300 120" className="w-full h-full">
            {data.map((d, i) => (
                <g key={i}>
                    <rect 
                        x={(i * (300 / data.length)) + 10} 
                        y={100 - (d.value / 100) * 100} 
                        width={(300 / data.length) - 20} 
                        height={(d.value / 100) * 100} 
                        fill={color} 
                        rx="4"
                        className="hover:opacity-80 transition-opacity"
                    />
                    <text x={(i * (300 / data.length)) + (300/data.length)/2} y="115" fontSize="8" textAnchor="middle" fill="#64748b" fontWeight="bold">{d.label}</text>
                </g>
            ))}
        </svg>
    );
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ activeMFY = 'ALL' }) => {
  const [activeTab, setActiveTab] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
     return MOCK_REPORTS.filter(item => {
        // Filter by MFY
        if (activeMFY !== 'ALL' && item.mfy !== activeMFY) return false;

        if (filterType !== 'ALL' && item.category !== filterType) return false;
        if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
        if (searchQuery && !item.locationName.toLowerCase().includes(searchQuery.toLowerCase()) && !item.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
     }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [filterType, filterStatus, searchQuery, activeMFY]);

  const stats = useMemo(() => {
      const total = filteredData.length;
      const critical = filteredData.filter(d => d.status === SensorStatus.CRITICAL).length;
      const warning = filteredData.filter(d => d.status === SensorStatus.WARNING).length;
      return { total, critical, warning };
  }, [filteredData]);

  const handleExport = () => {
      setIsExporting(true);
      setTimeout(() => {
          setIsExporting(false);
          alert("Hisobot PDF formatida yuklab olindi!");
      }, 1500);
  };

  const getStatusBadge = (status: SensorStatus) => {
      switch(status) {
          case SensorStatus.CRITICAL: return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 border border-red-200"><AlertCircle size={12}/> KRITIK</span>;
          case SensorStatus.WARNING: return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 border border-amber-200"><AlertTriangle size={12}/> DIQQAT</span>;
          case SensorStatus.OPTIMAL: return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600 border border-emerald-200"><CheckCircle size={12}/> NORMA</span>;
          default: return null;
      }
  };

  const getCategoryBadgeColor = (cat: string) => {
      switch(cat) {
          case 'CLIMATE': return 'bg-orange-100 text-orange-600';
          case 'WASTE': return 'bg-purple-100 text-purple-600';
          case 'MOISTURE': return 'bg-blue-100 text-blue-600';
          case 'AIR': return 'bg-sky-100 text-sky-600';
          case 'SECURITY': return 'bg-red-100 text-red-600';
          case 'LIGHT': return 'bg-yellow-100 text-yellow-600';
          case 'CONSTRUCTION': return 'bg-slate-100 text-slate-600';
          case 'TRANSPORT': return 'bg-indigo-100 text-indigo-600';
          case 'ECO_CONTROL': return 'bg-emerald-100 text-emerald-600';
          default: return 'bg-gray-100 text-gray-600';
      }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-20 shadow-sm shrink-0">
         <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileText size={24} className="text-blue-600"/> Tahlil Markazi</h2>
            <div className="flex gap-2">
                <p className="text-xs text-slate-500 font-medium">Gibrid analitika va AI hisobot tizimi</p>
                {activeMFY !== 'ALL' && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 rounded-full font-bold flex items-center">{activeMFY}</span>}
            </div>
         </div>
         <div className="flex gap-2">
            <button onClick={() => window.print()} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"><Printer size={18} /></button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
            >
               {isExporting ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> : <Download size={16} />}
               {isExporting ? 'Yuklanmoqda...' : 'Excel / PDF Yuklash'}
            </button>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Filters */}
          <div className="w-64 bg-white border-r border-slate-200 p-5 flex flex-col gap-6 overflow-y-auto shrink-0">
             <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Calendar size={14}/> Davrni Tanlang</h4>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                    {['DAILY', 'WEEKLY', 'MONTHLY'].map((t) => (
                        <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${activeTab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {t === 'DAILY' ? 'Kunlik' : t === 'WEEKLY' ? 'Haftalik' : 'Oylik'}
                        </button>
                    ))}
                </div>
             </div>

             <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Filter size={14}/> Filtrlar</h4>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Tizim Turi</label>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[10px] px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20">
                            <option value="ALL">Barchasi</option>
                            <option value="CLIMATE">Iqlim / Issiqlik</option>
                            <option value="WASTE">Chiqindi</option>
                            <option value="MOISTURE">Namlik</option>
                            <option value="AIR">Havo Sifati</option>
                            <option value="SECURITY">Xavfsizlik</option>
                            <option value="LIGHT">Yoritish</option>
                            <option value="CONSTRUCTION">Qurilish</option>
                            <option value="TRANSPORT">Transport</option>
                            <option value="ECO_CONTROL">Eko-Nazorat</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Status</label>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-[10px] px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20">
                            <option value="ALL">Barchasi</option>
                            <option value="CRITICAL">Kritik</option>
                            <option value="WARNING">Ogohlantirish</option>
                        </select>
                    </div>
                </div>
             </div>

             <div className="mt-auto">
                 <div className="p-4 bg-indigo-50 rounded-[16px] border border-indigo-100">
                     <div className="flex items-center gap-2 text-indigo-700 mb-2"><Coins size={16}/> <span className="text-xs font-bold">Tejalgan Mablag'</span></div>
                     <p className="text-2xl font-bold text-indigo-900">45.2 mln</p>
                     <p className="text-[10px] text-indigo-600 mt-1">O'tgan oyga nisbatan +12%</p>
                 </div>
             </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
             
             {/* KPI Cards & Charts Row */}
             <div className="p-5 grid grid-cols-12 gap-5 shrink-0">
                 {/* KPI Cards */}
                 <div className="col-span-3 space-y-4">
                     <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-4 rounded-[20px] shadow-sm border border-slate-100 flex items-center justify-between">
                         <div><p className="text-[10px] font-bold text-slate-400 uppercase">Jami Hisobotlar</p><p className="text-2xl font-bold text-slate-800">{stats.total}</p></div>
                         <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><FileText size={20}/></div>
                     </motion.div>
                     <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }} className="bg-white p-4 rounded-[20px] shadow-sm border border-red-50 flex items-center justify-between relative overflow-hidden">
                         <div className="relative z-10">
                             <p className="text-[10px] font-bold text-red-400 uppercase">Kritik Holatlar</p>
                             <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                         </div>
                         <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center relative z-10"><AlertCircle size={20}/></div>
                         {stats.critical > 0 && <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>}
                     </motion.div>
                     <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="bg-white p-4 rounded-[20px] shadow-sm border border-amber-50 flex items-center justify-between">
                         <div><p className="text-[10px] font-bold text-amber-400 uppercase">Ogohlantirishlar</p><p className="text-2xl font-bold text-amber-600">{stats.warning}</p></div>
                         <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"><AlertTriangle size={20}/></div>
                     </motion.div>
                 </div>

                 {/* Charts */}
                 <div className="col-span-5 bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><TrendingUp size={16} className="text-blue-500"/> Energiya Trendi</h3>
                         <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">24 soat</span>
                     </div>
                     <div className="flex-1 relative">
                         <SVGLineChart data={ANALYTICS_CHART_DATA[0].data} color="#3b82f6" />
                     </div>
                 </div>

                 <div className="col-span-4 bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><BarChart2 size={16} className="text-red-500"/> Chiqindi Darajasi</h3>
                         <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">Hududlar</span>
                     </div>
                     <div className="flex-1 relative">
                         <SVGBarChart data={ANALYTICS_CHART_DATA[1].data} color="#ef4444" />
                     </div>
                 </div>
             </div>

             {/* Data Table */}
             <div className="flex-1 px-5 pb-5 min-h-0 flex flex-col">
                 <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                     <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                         <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><PieChart size={16} className="text-purple-500"/> Batafsil Hisobotlar</h3>
                         <div className="relative">
                             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                             <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Qidirish..." className="bg-white border border-slate-200 rounded-full pl-9 pr-4 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 w-48" />
                         </div>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto custom-scrollbar">
                         <table className="w-full text-left border-collapse">
                             <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                 <tr>
                                     {['ID', 'Sana', 'MFY', 'Hudud / Manzil', 'Turi', 'Ko\'rsatkich', 'Moliya', 'Status', 'Mas\'ul'].map((h, i) => (
                                         <th key={i} className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">{h}</th>
                                     ))}
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                 {filteredData.map((row, i) => (
                                     <motion.tr 
                                         key={row.id} 
                                         initial={{ opacity: 0, y: 5 }} 
                                         animate={{ opacity: 1, y: 0 }} 
                                         transition={{ delay: i * 0.02 }} 
                                         className="hover:bg-blue-50/30 transition-colors group"
                                     >
                                         <td className="p-3 text-[10px] font-mono text-slate-400 font-bold">{row.id}</td>
                                         <td className="p-3 text-xs font-bold text-slate-700">{row.timestamp}</td>
                                         <td className="p-3 text-xs font-medium text-slate-600"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">{row.mfy}</span></td>
                                         <td className="p-3 text-xs font-bold text-slate-800">{row.locationName}</td>
                                         <td className="p-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded ${getCategoryBadgeColor(row.category)}`}>{row.category}</span></td>
                                         <td className="p-3 text-xs font-bold text-slate-700">{row.metricLabel}: {row.value}</td>
                                         <td className="p-3 text-xs font-mono font-bold text-slate-600">{row.costImpact || '-'}</td>
                                         <td className="p-3">{getStatusBadge(row.status)}</td>
                                         <td className="p-3 text-xs text-slate-500 flex items-center gap-1"><div className="w-5 h-5 rounded-full bg-slate-200 text-[9px] flex items-center justify-center font-bold text-slate-600">{row.responsible.charAt(0)}</div> {row.responsible}</td>
                                     </motion.tr>
                                 ))}
                             </tbody>
                         </table>
                         {filteredData.length === 0 && (
                             <div className="p-10 text-center text-slate-400 text-xs font-bold">Hech qanday ma'lumot topilmadi</div>
                         )}
                     </div>
                 </div>
             </div>
          </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsView;
