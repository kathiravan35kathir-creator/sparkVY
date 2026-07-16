import React, { useState } from 'react';
import {
  Activity,
  Plus,
  Search,
  Wrench,
  ShieldAlert,
  Calendar,
  CheckCircle,
  FileText,
  AlertTriangle,
  MapPin,
  Clock,
  Printer
} from 'lucide-react';
import { Equipment, EquipmentStatus } from '../types';

interface EquipmentViewProps {
  equipment: Equipment[];
  onAddEquipment: (equipPayload: Omit<Equipment, 'id' | 'equipmentCode'>) => void;
  onUpdateEquipmentStatus: (id: string, status: EquipmentStatus, notes?: string) => void;
  isAdmin: boolean;
}

export default function EquipmentView({
  equipment,
  onAddEquipment,
  onUpdateEquipmentStatus,
  isAdmin
}: EquipmentViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electrochemistry');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('Main Bench A');
  const [purchaseCost, setPurchaseCost] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState('2026-07-14');
  const [notes, setNotes] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Please fill in Equipment Name.');
      return;
    }

    onAddEquipment({
      name,
      category,
      manufacturer,
      model,
      serialNumber,
      location,
      purchaseCost: Number(purchaseCost),
      purchaseDate,
      notes,
      status: 'Available' as const,
      condition: 'Excellent'
    });

    // Reset Form
    setIsAdding(false);
    setName('');
    setManufacturer('');
    setModel('');
    setSerialNumber('');
    setNotes('');
  };

  const triggerCalibration = (id: string) => {
    onUpdateEquipmentStatus(id, 'Available', `Calibrated on ${new Date().toISOString().slice(0, 10)}.`);
    alert('Instrument calibration logged successfully. Next calibration date reset for 6 months.');
  };

  const triggerMaintenance = (id: string) => {
    onUpdateEquipmentStatus(id, 'Available', `Maintenance complete. Checked components.`);
    alert('Instrument maintenance logged successfully.');
  };

  const filteredEquipment = equipment.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.equipmentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eq.location && eq.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (eq.serialNumber && eq.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCond = filterCondition === 'All' || eq.status === filterCondition;
    return matchesSearch && matchesCond;
  });

  if (isAdding) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb / Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <span>Inventory</span>
              <span className="text-slate-300">/</span>
              <span>Equipment</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#172033] font-semibold">Register New Asset</span>
            </div>
            <h2 id="form-title" className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Register New Laboratory Asset / Equipment
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add high-end spectrometers, digital pH meters, centrifuges, and incubators. Log purchase values, serial codes, and starting calibration settings.
            </p>
          </div>
          <div>
            <button
              type="button"
              id="btn-back-to-list"
              onClick={() => { setIsAdding(false); }}
              className="px-4 py-2 bg-white border border-[#D8E0EA] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Back to Assets Inventory
            </button>
          </div>
        </div>

        {/* Full-width Form Layout */}
        <form onSubmit={handleSave} className="space-y-8 pb-20 font-sans">
          
          {/* SECTION 1: Technical asset specification */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Technical Specifications</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Asset Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PerkinElmer Gas Chromatograph"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Category Class</label>
                <select
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Electrochemistry">Electrochemistry (e.g. pH meters)</option>
                  <option value="Spectroscopy">Spectroscopy (e.g. UV-Vis, FTIR)</option>
                  <option value="Chromatography">Chromatography (e.g. HPLC, GC)</option>
                  <option value="Microbiology">Microbiology (e.g. Autoclaves)</option>
                  <option value="General Apparatus">General Apparatus (e.g. Balances)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Manufacturer Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Shimadzu Corp"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Model / Reference Code</label>
                <input
                  type="text"
                  placeholder="e.g. GC-2030 Pro"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Serial Number (Factory S/N)</label>
                <input
                  type="text"
                  placeholder="e.g. SN-98240-X"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono font-bold"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Storage Bench / Room Location</label>
                <input
                  type="text"
                  placeholder="e.g. Analytical Lab - Bench 4A"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold text-slate-700"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Financial Assets Data */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-wide uppercase">Financial Accounting & Asset Remarks</h3>
              <div className="h-px bg-[#E5EAF0] w-full mt-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Purchase Value (INR)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-bold font-mono"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Acquisition / Purchase Date</label>
                <input
                  type="date"
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Asset Operational Remarks / Warranty Notes</label>
                <input
                  type="text"
                  placeholder="E.g. Under 3 years comprehensive warranty. Yearly calibration contract signed."
                  className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions Sticky bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3.5 px-6 flex items-center justify-between z-40">
            <button
              type="button"
              onClick={() => { setIsAdding(false); }}
              className="px-4 py-2 border border-[#D8E0EA] text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel & Discard
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer"
            >
              Complete Asset Registration
            </button>
          </div>

        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in text-xs sm:text-sm">
      {/* Top Banner Control */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Analytical Laboratory Equipment Registers</h2>
          <p className="text-xs text-slate-500 mt-1">Audit high-end spectrometer assets, digital pH meters, log active calibration certificates, and maintenance records.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Plus size={14} />
            <span>Register New Asset</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* List panel */}
          <div className="col-span-1 lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between bg-slate-50/50">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search assets, serials..."
                  className="pl-8 pr-3 py-1.5 w-full bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status filter:</span>
                <select
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 focus:outline-none focus:border-blue-500 font-semibold"
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
                >
                  <option value="All">All Assets</option>
                  <option value="Available">Available / Active</option>
                  <option value="Calibration Due">Calibration Due</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 text-[10px] uppercase tracking-wider">
                    <th className="p-3">Asset Code</th>
                    <th className="p-3">Device Name</th>
                    <th className="p-3">Category / Location</th>
                    <th className="p-3">Next Calibration</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredEquipment.map((eq) => (
                    <tr
                      key={eq.id}
                      onClick={() => setSelectedEquip(eq)}
                      className="hover:bg-slate-50/50 cursor-pointer transition"
                    >
                      <td className="p-3 font-bold text-blue-600 font-mono">{eq.equipmentCode}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-800">{eq.name}</p>
                        <p className="text-[10px] text-slate-400">{eq.manufacturer} {eq.model}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-slate-700">{eq.category}</p>
                        <p className="text-[10px] text-slate-400 flex items-center space-x-0.5">
                          <MapPin size={10} />
                          <span>{eq.location}</span>
                        </p>
                      </td>
                      <td className="p-3 font-semibold text-slate-500">
                        {eq.nextCalibrationDate || 'N/A'}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          eq.status === 'Available'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : eq.status === 'Calibration Due'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {eq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Control panel */}
          <div className="col-span-1 lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
            {selectedEquip ? (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono">
                    {selectedEquip.equipmentCode}
                  </span>
                  <h3 className="font-extrabold text-slate-800 mt-1">{selectedEquip.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-slate-400 font-semibold block">Serial Number:</span>
                    <strong className="text-slate-700 font-mono">{selectedEquip.serialNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Location Bench:</span>
                    <strong className="text-slate-700">{selectedEquip.location || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Last Serviced:</span>
                    <strong className="text-slate-700">{selectedEquip.lastMaintenanceDate || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Next Calibration:</span>
                    <strong className="text-slate-700">{selectedEquip.nextCalibrationDate || 'N/A'}</strong>
                  </div>
                </div>

                {/* Operations Actions */}
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calibration & Quality Logs</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => triggerCalibration(selectedEquip.id)}
                      className="flex items-center justify-center space-x-1.5 p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-700 font-bold text-xs"
                    >
                      <CheckCircle size={13} />
                      <span>Log Calibration</span>
                    </button>
                    <button
                      onClick={() => triggerMaintenance(selectedEquip.id)}
                      className="flex items-center justify-center space-x-1.5 p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 font-bold text-xs"
                    >
                      <Wrench size={13} />
                      <span>Log Service</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Activity className="mx-auto mb-2 opacity-50 text-slate-300" size={32} />
                <p className="font-bold">Select an instrument</p>
                <p className="text-xs mt-0.5">Click any asset line to register its quality calibration seals or trigger repairs.</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
