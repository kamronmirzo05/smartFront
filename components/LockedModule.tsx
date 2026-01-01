import React from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface LockedModuleProps {
  moduleName?: string;
}

const LockedModule: React.FC<LockedModuleProps> = ({ moduleName = "Modul" }) => {
  return (
    <div className="flex items-center justify-center h-full w-full bg-[#eef2f6]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center p-8 bg-white rounded-[24px] shadow-lg border border-slate-200 max-w-md mx-4"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
            <Lock size={40} className="text-slate-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">
          Qulf chiqib
        </h2>
        <p className="text-slate-600 text-lg mb-2">
          {moduleName} moduli
        </p>
        <p className="text-slate-500 text-sm">
          Tez orada ishlaydi
        </p>
      </motion.div>
    </div>
  );
};

export default LockedModule;

