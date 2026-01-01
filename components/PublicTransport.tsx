
import React, { useEffect, useRef, useState } from 'react';
import { Bus, Coordinate } from '../types';
import { Bus as BusIcon, MapPin, Navigation, Clock, AlertTriangle, Users, Gauge, Radio, Fuel, Thermometer, Mic2, Video, StopCircle, DoorOpen, Heart, Activity, AlertCircle, PhoneCall, RadioTower, Power, Siren, Search, Filter, Check, ArrowRight, Layers, Eye, Route } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    L: any;
  }
}

interface PublicTransportProps {
  buses: Bus[];
  center: Coordinate;
}

// Custom Gauge Component (Light Version)
const CircularGauge = ({ value, max, label, color, icon: Icon }: any) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const circumference = 2 * Math.PI * 24; // r=24
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center">
            <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="24" stroke="#e2e8f0" strokeWidth="4" fill="transparent" />
                    <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className={`${color} transition-all duration-500 ease-out`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    <Icon size={16} />
                </div>
            </div>
            <div className="text-center mt-1">
                <span className="text-lg font-bold text-slate-800 leading-none">{Math.floor(value)}</span>
                <p className="text-[9px] text-slate-400 uppercase font-bold">{label}</p>
            </div>
        </div>
    );
};

const PublicTransport: React.FC<PublicTransportProps> = ({ buses: initialBuses, center }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);
  
  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [showCCTV, setShowCCTV] = useState(false);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [showTraffic, setShowTraffic] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ON_TIME' | 'DELAYED' | 'SOS' | 'STOPPED'>('ALL');

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current || !window.L || mapInstanceRef.current) return;

    try {
      const map = window.L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Light Mode Map Tiles
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
      
      trafficLayerRef.current = window.L.layerGroup().addTo(map);
      routeLayerRef.current = window.L.layerGroup().addTo(map);
      layerGroupRef.current = window.L.layerGroup().addTo(map);
      
      mapInstanceRef.current = map;
    } catch (e) {
      console.error("Map init error:", e);
    }
  }, []);

  // Update map view when center changes
  useEffect(() => {
      if (mapInstanceRef.current && center) {
          mapInstanceRef.current.setView([center.lat, center.lng], 14);
      }
  }, [center]);

  // Traffic Layer Effect
  useEffect(() => {
      if(!trafficLayerRef.current || !window.L) return;
      trafficLayerRef.current.clearLayers();

      if(showTraffic) {
          // Generate mock traffic lines
          const mainRoads = [
              [[center.lat, center.lng - 0.02], [center.lat, center.lng + 0.02]],
              [[center.lat - 0.02, center.lng], [center.lat + 0.02, center.lng]],
              [[center.lat - 0.015, center.lng - 0.015], [center.lat + 0.015, center.lng + 0.015]]
          ];

          mainRoads.forEach((road, i) => {
              const color = i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#10b981'; // Red, Yellow, Green
              window.L.polyline(road, { color: color, weight: 6, opacity: 0.6, lineCap: 'round' }).addTo(trafficLayerRef.current);
          });
      }
  }, [showTraffic, center]);

  // Route Rendering for Selected Bus
  useEffect(() => {
      if(!routeLayerRef.current || !window.L) return;
      routeLayerRef.current.clearLayers();

      if(selectedBus) {
          // Mock route: Create a path that goes through the bus location
          const path = [
              [selectedBus.location.lat - 0.01, selectedBus.location.lng - 0.01],
              [selectedBus.location.lat - 0.005, selectedBus.location.lng],
              [selectedBus.location.lat, selectedBus.location.lng], // Current pos
              [selectedBus.location.lat + 0.005, selectedBus.location.lng + 0.005],
              [selectedBus.location.lat + 0.01, selectedBus.location.lng + 0.002]
          ];

          // Draw the full route path
          window.L.polyline(path, { color: '#3b82f6', weight: 5, opacity: 0.5 }).addTo(routeLayerRef.current);
          
          // Draw stops
          path.forEach((pt: any) => {
              window.L.circleMarker(pt, { radius: 4, color: '#fff', fillColor: '#3b82f6', fillOpacity: 1 }).addTo(routeLayerRef.current);
          });
      }
  }, [selectedBus]);

  // Telemetry Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
        setBuses(prev => prev.map(bus => {
            // Simulate random movement & telemetry changes
            const isMoving = bus.status !== 'STOPPED' && bus.status !== 'SOS';
            const speedChange = isMoving ? (Math.random() - 0.5) * 5 : -1;
            const newSpeed = Math.max(0, Math.min(80, bus.speed + speedChange));
            const newRpm = isMoving ? Math.max(800, Math.min(2500, bus.rpm + (Math.random() - 0.5) * 100)) : 0;
            
            // Random Bearing Change (Turning)
            const bearingChange = isMoving ? (Math.random() - 0.5) * 10 : 0;
            
            // Heart Rate Variance
            const hrChange = (Math.random() - 0.5) * 4;

            // Simple movement logic
            const newLat = isMoving ? bus.location.lat + (Math.cos(bus.bearing * Math.PI / 180) * 0.00005) : bus.location.lat;
            const newLng = isMoving ? bus.location.lng + (Math.sin(bus.bearing * Math.PI / 180) * 0.00005) : bus.location.lng;

            return {
                ...bus,
                location: { lat: newLat, lng: newLng },
                bearing: (bus.bearing + bearingChange) % 360,
                speed: newSpeed,
                rpm: Math.floor(newRpm),
                driverHeartRate: Math.floor(Math.max(60, Math.min(120, bus.driverHeartRate + hrChange))),
                fuelLevel: Math.max(0, bus.fuelLevel - (isMoving ? 0.005 : 0)), // Slowly drain fuel
                cabinTemp: 22 + (Math.random() - 0.5)
            };
        }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync Selection
  useEffect(() => {
      if (selectedBus) {
          const liveBus = buses.find(b => b.id === selectedBus.id);
          if (liveBus) setSelectedBus(liveBus);
      }
  }, [buses]);

  // Update Map Markers
  useEffect(() => {
      if (!mapInstanceRef.current || !layerGroupRef.current || !window.L) return;
      layerGroupRef.current.clearLayers();

      const busesToRender = filterStatus === 'ALL' ? buses : buses.filter(b => b.status === filterStatus);

      busesToRender.forEach(bus => {
          let color = '#3b82f6'; // Blue default
          if (bus.status === 'DELAYED') color = '#fbbf24'; // Amber
          if (bus.status === 'SOS') color = '#ef4444'; // Red
          if (bus.status === 'ON_TIME') color = '#10b981'; // Emerald

          // Realistic Top-Down Bus Icon HTML
          const iconHtml = `
            <div class="relative flex items-center justify-center" style="transform: rotate(${bus.bearing}deg); transition: transform 1s linear;">
                <!-- SOS Pulse Effect -->
                ${bus.status === 'SOS' ? '<div class="absolute -inset-6 bg-red-500/40 rounded-full animate-ping"></div>' : ''}
                
                <!-- Bus Body -->
                <div class="relative w-8 h-14 rounded-xl border-2 border-white shadow-2xl flex flex-col items-center overflow-hidden transition-colors duration-300" style="background-color: ${color}; box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.4);">
                    
                    <!-- Windshield (Front) -->
                    <div class="w-full h-3.5 bg-slate-800 border-b border-white/20 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent to-white/30"></div>
                    </div>
                    
                    <!-- Roof / Route Number -->
                    <div class="flex-1 w-full flex items-center justify-center relative">
                        <!-- Roof Hatch/AC Unit -->
                        <div class="absolute top-1 w-5 h-3 bg-black/10 rounded-sm"></div>
                        
                        <!-- Route Number Text (Rotated to match bus) -->
                        <span class="text-[9px] font-black text-white/90 font-mono transform -rotate-90 drop-shadow-md z-10 tracking-tighter" style="text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${bus.routeNumber}</span>
                    </div>
                    
                    <!-- Rear Window/Engine Area -->
                    <div class="w-full h-1.5 bg-black/20 border-t border-white/10 flex justify-between px-1 items-center">
                        <div class="w-1.5 h-1 bg-red-200 rounded-full"></div>
                        <div class="w-1.5 h-1 bg-red-200 rounded-full"></div>
                    </div>
                </div>
            </div>
          `;

          const marker = window.L.marker([bus.location.lat, bus.location.lng], {
              icon: window.L.divIcon({ 
                  className: 'bg-transparent', 
                  html: iconHtml, 
                  iconSize: [32, 56], // Size of the bus wrapper
                  iconAnchor: [16, 28] // Center point of the bus
              })
          }).addTo(layerGroupRef.current);

          marker.on('click', () => {
              setSelectedBus(bus);
              mapInstanceRef.current.flyTo([bus.location.lat, bus.location.lng], 16);
          });
      });
  }, [buses, filterStatus]);

  // Filtering Logic
  const filteredBuses = buses.filter(bus => {
      const matchesSearch = 
        bus.routeNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
        bus.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bus.driverName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' ? true : bus.status === filterStatus;
      
      return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'ON_TIME': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
          case 'DELAYED': return 'text-amber-600 bg-amber-50 border-amber-100';
          case 'SOS': return 'text-red-600 bg-red-50 border-red-100 animate-pulse';
          case 'STOPPED': return 'text-slate-500 bg-slate-100 border-slate-200';
          default: return 'text-blue-600 bg-blue-50 border-blue-100';
      }
  };

  const handleCommand = (cmd: string) => {
      setActiveAlert(`Buyruq Yuborildi: ${cmd}`);
      setTimeout(() => setActiveAlert(null), 3000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden">
        {/* Command Toast */}
        {activeAlert && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl z-[500] flex items-center gap-2 animate-in slide-in-from-top-5 border border-emerald-400">
                <Check size={18} /> <span className="font-bold text-sm">{activeAlert}</span>
            </div>
        )}

        {/* Ops Center Header */}
        <div className="p-4 border-b border-slate-200 bg-white/90 flex justify-between items-center backdrop-blur-md z-30 shadow-sm">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800 tracking-wide">
                    <RadioTower className="text-blue-500" /> TRANSPORT BOSHQARUV MARKAZI
                </h2>
                <div className="flex gap-4 mt-1 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> TIZIM AKTIV</span>
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div> GPS SIGNAL: 99.8%</span>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                {/* Traffic Toggle */}
                <button onClick={() => setShowTraffic(!showTraffic)} className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${showTraffic ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <Layers size={14}/> Tirbandlik
                </button>

                <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Jami</span>
                    <span className="text-xl font-mono font-bold text-slate-700">{buses.length}</span>
                </div>
                <div className="bg-red-50 border border-red-100 px-4 py-2 rounded-lg flex items-center gap-3">
                    <span className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1"><Siren size={12}/> SOS</span>
                    <span className="text-xl font-mono font-bold text-red-500">{buses.filter(b => b.status === 'SOS').length}</span>
                </div>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
             {/* LEFT SIDEBAR: FLEET LIST */}
             <div className="w-72 border-r border-slate-200 bg-white flex flex-col z-20">
                 <div className="p-3 border-b border-slate-200 bg-slate-50 sticky top-0 space-y-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Qidirish (Yo'nalish, Raqam)..." 
                            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-slate-400 font-bold" 
                        />
                    </div>
                    <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                        {['ALL', 'ON_TIME', 'DELAYED', 'SOS', 'STOPPED'].map(status => (
                            <button 
                                key={status} 
                                onClick={() => setFilterStatus(status as any)}
                                className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors whitespace-nowrap ${filterStatus === status ? 'bg-slate-800 border-slate-800 text-white shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}
                            >
                                {status === 'ALL' ? 'BARCHASI' : status}
                            </button>
                        ))}
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-slate-50/50">
                    {filteredBuses.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <Filter size={24} className="mx-auto mb-2 text-slate-400"/>
                            <p className="text-xs text-slate-500">Hech qanday transport topilmadi</p>
                        </div>
                    ) : (
                        filteredBuses.map(bus => (
                            <div 
                                key={bus.id} 
                                onClick={() => setSelectedBus(bus)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm group relative overflow-hidden ${selectedBus?.id === bus.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-200'}`}
                            >
                                {/* Bus Status Indicator Bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${bus.status === 'SOS' ? 'bg-red-500 animate-pulse' : bus.status === 'ON_TIME' ? 'bg-emerald-500' : bus.status === 'DELAYED' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                                
                                <div className="pl-3 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold">{bus.routeNumber}</span>
                                            <h4 className="text-sm font-bold text-slate-800 font-mono">{bus.plateNumber}</h4>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><Users size={10}/> {bus.passengers} yo'lovchi</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getStatusColor(bus.status)}`}>{bus.status}</div>
                                        <p className="text-[10px] font-mono text-slate-400 mt-1">{Math.floor(bus.speed)} km/h</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                 </div>
             </div>

             {/* CENTER: MAP */}
             <div className="flex-1 relative z-0">
                 <div ref={mapContainerRef} className="absolute inset-0 bg-slate-100"></div>
                 {/* Map Overlays */}
                 <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-none">
                     <div className="bg-white/90 backdrop-blur p-3 rounded-xl border border-slate-200 shadow-xl">
                         <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Afsona</h4>
                         <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold font-mono">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div> O'z vaqtida
                         </div>
                         <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold font-mono mt-1">
                             <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div> Kechikkan
                         </div>
                         <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold font-mono mt-1">
                             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div> SOS / Nosozlik
                         </div>
                     </div>
                 </div>
             </div>

             {/* RIGHT SLIDE-OUT: COCKPIT DASHBOARD */}
             <AnimatePresence>
                 {selectedBus && (
                     <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute top-0 right-0 bottom-0 w-[450px] bg-white/95 backdrop-blur-xl border-l border-slate-200 z-40 flex flex-col shadow-2xl"
                     >
                         {/* Header */}
                         <div className="p-5 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                                     <BusIcon size={24} />
                                 </div>
                                 <div>
                                     <h3 className="text-xl font-bold text-slate-800">{selectedBus.routeNumber} <span className="text-slate-400 text-sm font-mono font-normal">| {selectedBus.plateNumber}</span></h3>
                                     <div className="flex items-center gap-2 mt-1">
                                         <div className={`w-2 h-2 rounded-full ${selectedBus.status === 'SOS' ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></div>
                                         <span className="text-xs text-slate-500 font-medium">Haydovchi: {selectedBus.driverName}</span>
                                     </div>
                                 </div>
                             </div>
                             <button onClick={() => setSelectedBus(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><ArrowRight size={20} /></button>
                         </div>

                         {/* Scrollable Content */}
                         <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                             
                             {/* Telemetry Gauges */}
                             <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                 <CircularGauge value={Math.floor(selectedBus.speed)} max={120} label="km/h" color="text-blue-500" icon={Gauge} />
                                 <CircularGauge value={selectedBus.rpm} max={4000} label="RPM" color="text-amber-500" icon={Activity} />
                                 <CircularGauge value={selectedBus.fuelLevel} max={100} label="Fuel %" color={selectedBus.fuelLevel < 20 ? 'text-red-500' : 'text-emerald-500'} icon={Fuel} />
                             </div>

                             {/* Route Info */}
                             <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-3">
                                 <Route size={20} className="text-blue-600"/>
                                 <div>
                                     <p className="text-[10px] font-bold text-blue-400 uppercase">Keyingi Bekat</p>
                                     <p className="text-sm font-bold text-blue-800">{selectedBus.nextStop}</p>
                                 </div>
                                 <div className="ml-auto text-right">
                                     <p className="text-[10px] font-bold text-blue-400 uppercase">Yetib borish</p>
                                     <p className="text-sm font-mono font-bold text-blue-800">4 daq</p>
                                 </div>
                             </div>

                             {/* Status Grid */}
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                                     <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><Thermometer size={14}/> Dvigatel</div>
                                     <span className={`text-sm font-mono font-bold ${selectedBus.engineTemp > 95 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>{selectedBus.engineTemp}°C</span>
                                 </div>
                                 <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                                     <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><DoorOpen size={14}/> Eshiklar</div>
                                     <span className={`text-sm font-mono font-bold ${selectedBus.doorStatus === 'OPEN' ? 'text-amber-500' : 'text-slate-600'}`}>{selectedBus.doorStatus}</span>
                                 </div>
                                 <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                                     <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><Users size={14}/> Yo'lovchilar</div>
                                     <span className="text-sm font-mono font-bold text-slate-700">{selectedBus.passengers}</span>
                                 </div>
                                 <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                                     <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><Thermometer size={14}/> Salon</div>
                                     <span className="text-sm font-mono font-bold text-slate-700">{selectedBus.cabinTemp.toFixed(1)}°C</span>
                                 </div>
                             </div>

                             {/* Driver Health */}
                             <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Heart size={14} className="text-red-500"/> Haydovchi Holati (IoT)</h4>
                                 <div className="flex items-center gap-4">
                                     <div className="text-center">
                                         <span className="text-2xl font-bold text-slate-800 font-mono">{selectedBus.driverHeartRate}</span>
                                         <p className="text-[9px] text-slate-400 uppercase">BPM</p>
                                     </div>
                                     <div className="w-px h-8 bg-slate-200"></div>
                                     <div className="flex-1">
                                         <div className="flex justify-between text-xs mb-1">
                                             <span className="text-slate-500 font-bold">Charchoq Darajasi</span>
                                             <span className={`font-bold ${selectedBus.driverFatigueLevel === 'HIGH' ? 'text-red-500' : 'text-emerald-500'}`}>{selectedBus.driverFatigueLevel}</span>
                                         </div>
                                         <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                             <div className={`h-full rounded-full ${selectedBus.driverFatigueLevel === 'HIGH' ? 'bg-red-500 w-3/4' : selectedBus.driverFatigueLevel === 'MEDIUM' ? 'bg-amber-500 w-1/2' : 'bg-emerald-500 w-1/4'}`}></div>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             {/* Cameras Preview */}
                             <div>
                                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Video size={14}/> Kamera Kuzatuvi</h4>
                                 <div className="grid grid-cols-2 gap-2">
                                     <div className="aspect-video bg-black rounded-lg overflow-hidden relative group border border-slate-300">
                                         <img src={selectedBus.cctvUrls.driver} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                                         <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 text-white px-1 rounded">Driver Cam</span>
                                     </div>
                                     <div className="aspect-video bg-black rounded-lg overflow-hidden relative group border border-slate-300">
                                         <img src={selectedBus.cctvUrls.cabin} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                                         <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 text-white px-1 rounded">Cabin Cam</span>
                                     </div>
                                 </div>
                                 <button onClick={() => setShowCCTV(true)} className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-blue-600 transition-colors">Barcha Kameralarni Ochish (Grid View)</button>
                             </div>

                             {/* Alert Actions */}
                             {selectedBus.status === 'SOS' && (
                                 <div className="bg-red-50 border border-red-100 p-4 rounded-2xl animate-pulse">
                                     <h4 className="text-red-600 font-bold flex items-center gap-2 mb-2"><AlertCircle size={18}/> FAVQULODDA VAZIYAT!</h4>
                                     <p className="text-xs text-red-500 mb-3">Haydovchi SOS tugmasini bosdi. Zudlik bilan aloqaga chiqing.</p>
                                     <div className="flex gap-2">
                                         <button onClick={() => handleCommand("102 Xizmati Chaqirildi")} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-bold">102 / 103 Chaqirish</button>
                                         <button onClick={() => handleCommand("Dispetcher Aloqaga Chiqmoqda")} className="flex-1 bg-white hover:bg-slate-50 text-red-600 border border-red-200 py-2 rounded-lg text-xs font-bold">Dispetcher Aloqasi</button>
                                     </div>
                                 </div>
                             )}
                         </div>

                         {/* Bottom Controls */}
                         <div className="p-4 border-t border-slate-200 bg-slate-50 grid grid-cols-2 gap-3">
                             <button onClick={() => handleCommand("Ovozli Aloqa O'rnatildi")} className="py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                                 <Mic2 size={16}/> Aloqaga Chiqish
                             </button>
                             <button onClick={() => handleCommand("Dvigatel Masofadan O'chirildi")} className="py-3 rounded-xl bg-slate-200 hover:bg-red-500 hover:text-white text-slate-600 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 group">
                                 <StopCircle size={16} className="group-hover:animate-pulse"/> Dvigatelni O'chirish
                             </button>
                         </div>
                     </motion.div>
                 )}
             </AnimatePresence>

             {/* CCTV Full Modal (Grid Layout) */}
             <AnimatePresence>
                 {showCCTV && selectedBus && (
                     <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
                         <div className="w-full h-full max-w-6xl flex flex-col">
                             <div className="flex justify-between items-center mb-4 text-white">
                                 <h2 className="text-xl font-bold flex items-center gap-2"><Video className="text-red-500 animate-pulse"/> JONLI KUZATUV: {selectedBus.routeNumber}</h2>
                                 <button onClick={() => setShowCCTV(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold">Yopish X</button>
                             </div>
                             <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
                                 <div className="bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden group">
                                     <img src={selectedBus.cctvUrls.front} className="w-full h-full object-cover"/>
                                     <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">CAM 1: FRONT</div>
                                     <div className="absolute inset-0 border-4 border-transparent group-hover:border-blue-500 transition-colors pointer-events-none"></div>
                                 </div>
                                 <div className="bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden group">
                                     <img src={selectedBus.cctvUrls.driver} className="w-full h-full object-cover"/>
                                     <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">CAM 2: DRIVER</div>
                                     {/* AI Driver Analysis Overlay */}
                                     <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur px-3 py-2 rounded-lg border border-white/20">
                                         <p className="text-[10px] text-slate-400 uppercase font-bold">AI Analysis</p>
                                         <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> FOCUS: GOOD</div>
                                     </div>
                                 </div>
                                 <div className="bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden group">
                                     <img src={selectedBus.cctvUrls.cabin} className="w-full h-full object-cover"/>
                                     <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">CAM 3: CABIN</div>
                                     {/* Heatmap Overlay Simulation */}
                                     <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/10 mix-blend-overlay"></div>
                                 </div>
                                 <div className="bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center text-slate-500 flex-col border-dashed">
                                     <RadioTower size={48} className="mb-2 opacity-50"/>
                                     <p className="font-bold">CAM 4: REAR (NO SIGNAL)</p>
                                 </div>
                             </div>
                         </div>
                     </div>
                 )}
             </AnimatePresence>
        </div>
    </div>
  );
};

export default PublicTransport;
