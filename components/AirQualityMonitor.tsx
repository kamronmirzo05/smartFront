
import React from 'react';
import { AirSensor, SensorStatus } from '../types';
import { Wind, CloudFog, AlertTriangle, CheckCircle, Droplets, Thermometer, MapPin, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface AirQualityMonitorProps {
  sensors: AirSensor[];
  activeMFY?: string;
}

const AirQualityMonitor: React.FC<AirQualityMonitorProps> = ({ sensors, activeMFY = 'ALL' }) => {
  const filteredSensors = activeMFY === 'ALL' ? sensors : sensors.filter(s => s.mfy === activeMFY);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-emerald-500 text-white';
    if (aqi <= 100) return 'bg-yellow-500 text-white';
    if (aqi <= 150) return 'bg-orange-500 text-white';
    return 'bg-red-600 text-white animate-pulse';
  };

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { label: 'Yaxshi', desc: 'Toza havo, xavf yo\'q.' };
    if (aqi <= 100) return { label: 'O\'rtacha', desc: 'Sezgir kishilar uchun noqulay bo\'lishi mumkin.' };
    if (aqi <= 150) return { label: 'Nosog\'lom', desc: 'Bolalar va qariyalar ehtiyot bo\'lishi kerak.' };
    return { label: 'Xavfli', desc: 'Barcha uchun zararli. Tashqariga chiqmang.' };
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm shrink-0">
         <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wind size={24} className="text-sky-500"/> Havo Sifati Monitoringi
         </h2>
         <p className="text-xs text-slate-500 font-medium">MFY kesimida ekologik holat tahlili (Xalqaro AQI standarti)</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
         {filteredSensors.length === 0 ? (
             <div className="text-center py-20 text-slate-400">
                 <Wind size={48} className="mx-auto mb-3 opacity-50"/>
                 <p className="font-bold">Bu hududda havo datchiklari o'rnatilmagan</p>
             </div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                 {filteredSensors.map((sensor, idx) => {
                     const status = getAQIStatus(sensor.aqi);
                     const colorClass = getAQIColor(sensor.aqi);
                     
                     return (
                         <motion.div 
                             key={sensor.id}
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: idx * 0.05 }}
                             className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
                         >
                             <div className="p-5 border-b border-slate-50">
                                 <div className="flex justify-between items-start mb-2">
                                     <div>
                                         <h3 className="font-bold text-slate-800 text-sm">{sensor.name}</h3>
                                         <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold mt-1 bg-slate-50 w-fit px-2 py-0.5 rounded-full">
                                             <MapPin size={10} /> {sensor.mfy}
                                         </div>
                                     </div>
                                     <div className={`px-3 py-1 rounded-[12px] text-xs font-bold shadow-sm ${colorClass}`}>
                                         AQI {sensor.aqi}
                                     </div>
                                 </div>
                                 <div className="mt-3 p-3 bg-slate-50 rounded-[16px] border border-slate-100">
                                     <div className="flex items-center gap-2 mb-1">
                                         {sensor.aqi > 100 ? <AlertTriangle size={14} className="text-red-500"/> : <CheckCircle size={14} className="text-emerald-500"/>}
                                         <span className="text-xs font-bold text-slate-700">{status.label}</span>
                                     </div>
                                     <p className="text-[10px] text-slate-500 leading-tight">{status.desc}</p>
                                 </div>
                             </div>
                             
                             <div className="p-5 grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                     <p className="text-[9px] font-bold text-slate-400 uppercase">PM2.5 (Chang)</p>
                                     <p className="text-sm font-bold text-slate-700">{sensor.pm25} µg/m³</p>
                                     <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-slate-400 rounded-full" style={{width: `${(sensor.pm25 / 100) * 100}%`}}></div></div>
                                 </div>
                                 <div className="space-y-1">
                                     <p className="text-[9px] font-bold text-slate-400 uppercase">CO2 (Gaz)</p>
                                     <p className="text-sm font-bold text-slate-700">{sensor.co2} ppm</p>
                                     <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-slate-400 rounded-full" style={{width: `${(sensor.co2 / 1000) * 100}%`}}></div></div>
                                 </div>
                                 <div className="space-y-1">
                                     <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><Thermometer size={10}/> Harorat</p>
                                     <p className="text-sm font-bold text-slate-700">{24}°C</p>
                                 </div>
                                 <div className="space-y-1">
                                     <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><Droplets size={10}/> Namlik</p>
                                     <p className="text-sm font-bold text-slate-700">{45}%</p>
                                 </div>
                             </div>
                         </motion.div>
                     );
                 })}
             </div>
         )}
      </div>
    </div>
  );
};

export default AirQualityMonitor;
