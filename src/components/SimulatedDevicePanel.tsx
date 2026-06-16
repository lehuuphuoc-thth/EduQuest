import React, { useEffect, useState } from 'react';
import { DEMO_DEVICES, getStoredDevice, setStoredDevice, DeviceFingerprint } from '../utils/db';
import { Laptop, Moon, Sun, Smartphone, Chrome } from 'lucide-react';

interface SimulatedDevicePanelProps {
  onDeviceChange?: (device: DeviceFingerprint) => void;
}

export const SimulatedDevicePanel: React.FC<SimulatedDevicePanelProps> = ({ onDeviceChange }) => {
  const [currentDevice, setCurrentDevice] = useState<DeviceFingerprint>(DEMO_DEVICES[0]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dev = getStoredDevice();
    setCurrentDevice(dev);
  }, []);

  const handleSelectDevice = (device: DeviceFingerprint) => {
    setStoredDevice(device);
    setCurrentDevice(device);
    if (onDeviceChange) {
      onDeviceChange(device);
    }
    // Reload state or trigger dispatch
    window.dispatchEvent(new Event('device-changed'));
  };

  return (
    <div className="bg-slate-900 border-b border-indigo-500/30 px-3 py-2 text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono tracking-wider text-slate-400">DEVICE SANDBOX SIMULATOR:</span>
          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
            <Laptop className="h-3.5 w-3.5" />
            {currentDevice.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px] max-md:hidden select-none">
            Click to switch device & test device-locking logins:
          </span>

          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            {DEMO_DEVICES.map((dev) => {
              const isSelected = dev.id === currentDevice.id;
              return (
                <button
                  key={dev.id}
                  onClick={() => handleSelectDevice(dev)}
                  className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                  title={dev.userAgent}
                >
                  {dev.name.split(' (')[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
