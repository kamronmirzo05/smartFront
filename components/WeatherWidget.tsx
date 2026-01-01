
import React from 'react';
import { Weather, WeatherForecast } from '../types';
import { Cloud, CloudRain, Sun, Wind, Droplets, CloudLightning, CloudSnow } from 'lucide-react';

interface WeatherWidgetProps {
  current: Weather;
  forecast: WeatherForecast[];
  locationName: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ current, forecast, locationName }) => {
  const getIcon = (condition: string, className?: string) => {
    switch (condition.toUpperCase()) {
      case 'SUN': case 'CLEAR': return <Sun className={className || "text-orange-500"} />;
      case 'CLOUD': case 'CLOUDY': return <Cloud className={className || "text-slate-400"} />;
      case 'RAIN': case 'RAINY': return <CloudRain className={className || "text-blue-500"} />;
      case 'STORM': return <CloudLightning className={className || "text-purple-500"} />;
      case 'SNOW': return <CloudSnow className={className || "text-sky-300"} />;
      default: return <Sun className={className || "text-orange-500"} />;
    }
  };

  return (
    <div className="ios-glass rounded-[24px] p-5 shadow-sm border border-white/50 flex flex-col gap-4 bg-white/60 shrink-0">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Cloud size={12}/> Ob-Havo
          </h3>
          <h2 className="text-sm font-bold text-slate-700 mt-1">{locationName}</h2>
        </div>
        <div className="flex flex-col items-end">
           <div className="flex items-start">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">{current.temp}°</span>
                <span className="text-xs font-bold text-slate-400 mt-1">C</span>
           </div>
           <span className="text-[10px] font-bold text-slate-500">{current.condition}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-blue-50/80 px-3 py-2 rounded-[14px] border border-blue-100">
              <Droplets size={14} className="text-blue-500"/> 
              <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Namlik</p>
                  <p className="text-xs font-bold text-blue-700">{current.humidity}%</p>
              </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-2 rounded-[14px] border border-slate-200">
              <Wind size={14} className="text-slate-500"/> 
              <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Shamol</p>
                  <p className="text-xs font-bold text-slate-700">{current.windSpeed} km/h</p>
              </div>
          </div>
      </div>

      <div className="h-px bg-slate-200/50"></div>

      <div className="flex justify-between items-center px-1">
          {forecast.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 group cursor-default">
                  <span className="text-[9px] font-bold text-slate-400 uppercase group-hover:text-blue-500 transition-colors">{day.day.substring(0, 3)}</span>
                  <div className="p-1.5 rounded-full bg-white/50 border border-white shadow-sm group-hover:scale-110 transition-transform">
                      {React.cloneElement(getIcon(day.icon) as React.ReactElement, { size: 16 })}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">{day.temp}°</span>
              </div>
          ))}
      </div>
    </div>
  );
};

export default WeatherWidget;
