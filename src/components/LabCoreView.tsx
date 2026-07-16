import React, { useState } from 'react';
import {
  Search,
  Plus,
  Activity,
  AlertTriangle,
  FileText,
  Printer,
  Compass,
  QrCode,
  MapPin,
  Clock,
  Lock,
  RotateCcw,
  CheckCircle,
  Award,
  FlaskConical,
  User,
  Shield,
  Check
} from 'lucide-react';
import { Sample, Party, Item, LabReport, SampleStatus, SamplePriority, ParameterResult, AppSettings } from '../types';
import DocumentPrintView from './DocumentPrintView';

interface LabCoreViewProps {
  samples: Sample[];
  parties: Party[];
  items: Item[];
  onAddSample: (sample: Omit<Sample, 'id' | 'sampleCode' | 'barcodeData' | 'status' | 'timeline' | 'createdAt'>) => void;
  onUpdateSampleStatus: (id: string, status: SampleStatus, custodyNotes?: string) => void;
  onUpdateTestResults: (sampleId: string, testId: string, results: Partial<ParameterResult>[]) => void;
  onApproveReport: (sampleId: string, reviewerName: string) => void;
  isAdmin: boolean;
  initialTab?: 'samples' | 'worksheets' | 'reports';
  settings: AppSettings;
}

export default function LabCoreView({
  samples,
  parties,
  items,
  onAddSample,
  onUpdateSampleStatus,
  onUpdateTestResults,
  onApproveReport,
  isAdmin,
  initialTab,
  settings
}: LabCoreViewProps) {
  // Tabs: Samples Intake, Analytical Worksheets, Review & Certify
  const [activeLimsTab, setActiveLimsTab] = useState<'samples' | 'worksheets' | 'reports'>(initialTab || 'samples');

  React.useEffect(() => {
    if (initialTab) {
      setActiveLimsTab(initialTab);
    }
  }, [initialTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Modal / Drawer toggle state
  const [isRegistering, setIsRegistering] = useState(false);
  const [viewingSample, setViewingSample] = useState<Sample | null>(null);
  const [editingResultsSample, setEditingResultsSample] = useState<Sample | null>(null);
  const [selectedTestIdForResults, setSelectedTestIdForResults] = useState<string>('');
  const [printingSampleReport, setPrintingSampleReport] = useState<Sample | null>(null);

  // Form Field State: Sample intake
  const [partyId, setPartyId] = useState('');
  const [sampleName, setSampleName] = useState('');
  const [sampleType, setSampleType] = useState('Drinking Water');
  const [sampleCategory, setSampleCategory] = useState('Microbiological');
  const [quantity, setQuantity] = useState(500);
  const [unit, setUnit] = useState('ml');
  const [receivedCondition, setReceivedCondition] = useState('Cool, Intact');
  const [storageLocation, setStorageLocation] = useState('Chiller chamber 2');
  const [priority, setPriority] = useState<SamplePriority>('Normal');
  const [customerInstructions, setCustomerInstructions] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  // Worksheet input fields state
  const [paramResults, setParamResults] = useState<Array<{ name: string; val: string; status: 'Normal' | 'Abnormal' | 'Critical' }>>([
    { name: 'Coliform Count', val: '', status: 'Normal' },
    { name: 'E. Coli Pathogen', val: '', status: 'Normal' }
  ]);
  const [technicianNotes, setTechnicianNotes] = useState('');

  const activeCustomers = parties.filter((p) => p.type === 'Customer' || p.type === 'Both');
  const diagnosticServices = items.filter((it) => it.type === 'Laboratory Service');

  // Handle register submission
  const handleRegisterIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) {
      alert('Please choose a registered customer party.');
      return;
    }
    if (selectedTestIds.length === 0) {
      alert('Please specify at least one diagnostic assay parameter.');
      return;
    }

    const customer = parties.find((p) => p.id === partyId)!;
    const today = new Date().toISOString().slice(0, 10);
    const expected = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    onAddSample({
      partyId,
      partyName: customer.name,
      sampleName,
      sampleType,
      sampleCategory,
      quantity: Number(quantity),
      unit,
      receivedDate: today,
      receivedTime: new Date().toTimeString().slice(0, 5),
      receivedBy: isAdmin ? 'Admin' : 'Staff',
      receivedCondition,
      storageLocation,
      requiredTestIds: selectedTestIds,
      priority,
      expectedCompletionDate: expected,
      customerInstructions,
      internalNotes
    });

    // Reset Form fields
    setIsRegistering(false);
    setPartyId('');
    setSampleName('');
    setSelectedTestIds([]);
    setCustomerInstructions('');
    setInternalNotes('');
  };

  const handleToggleTestSelected = (id: string) => {
    if (selectedTestIds.includes(id)) {
      setSelectedTestIds(selectedTestIds.filter((tId) => tId !== id));
    } else {
      setSelectedTestIds([...selectedTestIds, id]);
    }
  };

  if (isRegistering) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb / Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <span>LIMS Operations</span>
              <span className="text-slate-300">/</span>
              <span>Sample Registry</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#172033] font-semibold">New Specimen Intake</span>
            </div>
            <h2 id="form-title" className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Bio-Matrix Sample Intake Receipt
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Record physical specimens, specify sample type/matrix classifications, assign cold custody locations, and check requested diagnostic assays.
            </p>
          </div>
          <div>
            <button
              type="button"
              id="btn-back-to-lims"
              onClick={() => { setIsRegistering(false); }}
              className="px-4 py-2 bg-white border border-[#D8E0EA] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Back to LIMS Registry
            </button>
          </div>
        </div>

        {/* Full ERP Form Layout */}
        <form onSubmit={handleRegisterIntake} className="space-y-8 pb-20 font-sans">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Basic Details & Parameters Checklist */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Depositor Panel */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Depositor Details</h3>
                  <div className="h-px bg-[#E5EAF0] w-full mt-1.5" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Customer / Client Party <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={partyId}
                      onChange={(e) => setPartyId(e.target.value)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-semibold"
                    >
                      <option value="">-- Choose Depositor Client --</option>
                      {activeCustomers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} [{p.code}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Sample Label Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ingress Raw Water Tank B"
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-medium"
                      value={sampleName}
                      onChange={(e) => setSampleName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Testing Urgency <span className="text-red-500">*</span></label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as SamplePriority)}
                      className="w-full h-[42px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-bold"
                    >
                      <option value="Normal">Normal (5 days turnaround)</option>
                      <option value="High">High (2 days turnaround)</option>
                      <option value="Urgent">Urgent (24h fast track)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lab Assay Tests Parameter Checklist */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Assay Suite Parameter Selection</h3>
                  <div className="h-px bg-[#E5EAF0] w-full mt-1.5" />
                </div>

                <div className="border border-[#D8E0EA] rounded-xl overflow-hidden bg-white shadow-xs max-h-[280px] overflow-y-auto">
                  <div className="divide-y divide-[#E5EAF0]">
                    {diagnosticServices.map((it) => {
                      const isChecked = selectedTestIds.includes(it.id);
                      return (
                        <label
                          key={it.id}
                          className={`flex items-start space-x-3 p-3.5 hover:bg-slate-50 transition cursor-pointer text-xs ${
                            isChecked ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleTestSelected(it.id)}
                            className="mt-0.5 h-4 w-4 text-[#2563EB] border-[#D8E0EA] rounded focus:ring-blue-500 transition"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-baseline">
                              <span className="font-extrabold text-slate-800 text-xs">{it.name}</span>
                              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                ₹{it.sellingPrice.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              Methodology: <span className="font-mono text-slate-500">{it.testMethod || 'ISO Standard'}</span> | Unit: {it.unit || 'mg/L'}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Physical / Custody Specifications */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Physical Specimen Traits</h3>
                  <div className="h-px bg-[#E5EAF0] w-full mt-1.5" />
                </div>

                <div className="bg-slate-50 border border-[#D8E0EA] rounded-xl p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Matrix Classification <span className="text-red-500">*</span></label>
                    <select
                      value={sampleType}
                      onChange={(e) => setSampleType(e.target.value)}
                      className="w-full h-[40px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-semibold"
                    >
                      <option value="Drinking Water">Drinking Water</option>
                      <option value="Blood">Blood (Diagnostic)</option>
                      <option value="Soil / Compost">Soil / Compost</option>
                      <option value="Chemical Matrix">Chemical Reagents / Waste</option>
                      <option value="Air Impurity Capsule">Air Impurity Capsule</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quantity <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        required
                        className="w-full h-[40px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs font-mono text-slate-900 focus:outline-none"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        className="w-full h-[40px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:outline-none font-bold"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Storage Custody Unit <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chiller cabinet 2 / Freezer B"
                      className="w-full h-[40px] px-3 bg-white border border-[#D8E0EA] rounded-md text-xs text-slate-900 focus:outline-none"
                      value={storageLocation}
                      onChange={(e) => setStorageLocation(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Depositor Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Avoid light exposure, incubate within 4 hours"
                      className="w-full p-3 bg-white border border-[#D8E0EA] rounded-lg text-xs text-slate-900 focus:outline-none"
                      value={customerInstructions}
                      onChange={(e) => setCustomerInstructions(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Internal Registry Notes</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Seal looks intact, sample color pale brown"
                      className="w-full p-3 bg-white border border-[#D8E0EA] rounded-lg text-xs text-slate-900 focus:outline-none"
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3.5 px-6 flex items-center justify-between z-40">
            <button
              type="button"
              onClick={() => { setIsRegistering(false); }}
              className="px-4 py-2 border border-[#D8E0EA] text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel & Discard Specimen
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0F9D8A] hover:bg-[#0d8575] text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer"
            >
              Acknowledge & Accept Sample
            </button>
          </div>

        </form>
      </div>
    );
  }

  const handleOpenResultsForm = (sample: Sample) => {
    setEditingResultsSample(sample);
    if (sample.requiredTestIds.length > 0) {
      setSelectedTestIdForResults(sample.requiredTestIds[0]);
    }
  };

  const handleSaveAssayResults = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResultsSample) return;

    // Map custom worksheet state to schema ParameterResult
    const mapped: Partial<ParameterResult>[] = paramResults.map((r, idx) => ({
      id: `param-${idx}-${Date.now()}`,
      parameterName: r.name,
      method: 'IS Membrane Filtration',
      resultValue: r.val,
      unit: 'CFU/100ml',
      referenceRange: 'Absent',
      status: r.status
    }));

    onUpdateTestResults(editingResultsSample.id, selectedTestIdForResults, mapped);
    onUpdateSampleStatus(editingResultsSample.id, 'Result Entered', 'Observations posted to clinical worksheets.');
    setEditingResultsSample(null);
  };

  // Filter Sample collection
  const filteredSamples = samples.filter((s) => {
    const matchesSearch =
      s.sampleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sampleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.partyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">ISO 17025 LIMS Sample Custody</h2>
          <p className="text-xs text-slate-500 mt-1">Accept samples, route to analytical test benches, fill chemistry parameters, and seal NABL certificates.</p>
        </div>
        {activeLimsTab === 'samples' && isAdmin && (
          <button
            onClick={() => setIsRegistering(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0F9D8A] hover:bg-[#0d8575] text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Plus size={14} />
            <span>Sample Intake Receipt</span>
          </button>
        )}
      </div>

      {/* LIMS Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveLimsTab('samples')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeLimsTab === 'samples'
                ? 'border-[#0F9D8A] text-[#0F9D8A]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Samples Intake Hub ({samples.length})
          </button>
          <button
            onClick={() => setActiveLimsTab('worksheets')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeLimsTab === 'worksheets'
                ? 'border-[#0F9D8A] text-[#0F9D8A]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Analytical Test Worksheets
          </button>
          <button
            onClick={() => setActiveLimsTab('reports')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeLimsTab === 'reports'
                ? 'border-[#0F9D8A] text-[#0F9D8A]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Report Approval & Sign-offs
          </button>
        </nav>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search samples by code, matrix type, customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-bold">Status</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 font-semibold focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Received">Received</option>
            <option value="Registered">Registered</option>
            <option value="Testing">Testing</option>
            <option value="Result Entered">Result Entered</option>
            <option value="Under Review">Under Review</option>
            <option value="Report Ready">Report Ready</option>
          </select>
        </div>
      </div>

      {/* SAMPLES HUB TAB */}
      {activeLimsTab === 'samples' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Sample Code</th>
                  <th className="py-3 px-4">Sample Matrix</th>
                  <th className="py-3 px-4">Depositor Partner</th>
                  <th className="py-3 px-4">Intake Date</th>
                  <th className="py-3 px-4 text-center">Assays Assigned</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-center">Workflow Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSamples.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No active samples received in database search range.
                    </td>
                  </tr>
                ) : (
                  filteredSamples.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 flex items-center space-x-1.5">
                        <QrCode size={13} className="text-[#0F9D8A]" />
                        <span>{s.sampleCode}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-800">{s.sampleName}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{s.sampleType} | {s.quantity} {s.unit}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">{s.partyName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{s.receivedDate} {s.receivedTime}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded text-[10px] border border-slate-200">
                          {s.requiredTestIds.length} tests
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded ${
                          s.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' :
                          s.priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {s.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full ${
                          s.status === 'Report Ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          s.status === 'Result Entered' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          s.status === 'Testing' ? 'bg-purple-50 text-purple-700 border border-purple-100 animate-pulse' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setViewingSample(s)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition inline-flex items-center"
                          title="View custody logs & instructions"
                        >
                          <Activity size={12} />
                        </button>
                        {isAdmin && s.status !== 'Report Ready' && (
                          <button
                            onClick={() => {
                              const nextStatusMap: { [key: string]: SampleStatus } = {
                                'Received': 'Testing',
                                'Registered': 'Testing',
                                'Testing': 'Result Entered',
                                'Result Entered': 'Under Review',
                                'Under Review': 'Report Ready'
                              };
                              const nextStatus = nextStatusMap[s.status] || 'Testing';
                              onUpdateSampleStatus(s.id, nextStatus, `Promoted status workflow to: ${nextStatus}`);
                            }}
                            className="px-2 py-1 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold transition inline-flex items-center"
                          >
                            <span>Promote &rarr;</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICAL TEST WORKSHEETS TAB */}
      {activeLimsTab === 'worksheets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
              <FlaskConical size={14} className="text-purple-600" />
              <span>Assigned Chemistry Worksheets</span>
            </h3>
            <p className="text-[10px] text-slate-400">Select any active sample currently undergoing analytical testing to fill in physical parameters.</p>

            <div className="divide-y divide-slate-100">
              {samples.filter(s => s.status === 'Testing' || s.status === 'Result Entered').map((s) => (
                <div key={s.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/40 px-2 rounded-lg transition">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900">{s.sampleCode}</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">{s.sampleType}</span>
                    </div>
                    <p className="font-bold text-slate-800 mt-1">{s.sampleName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Assay parameters pending: {s.requiredTestIds.join(', ')}</p>
                  </div>
                  <button
                    onClick={() => handleOpenResultsForm(s)}
                    className="px-3 py-1.5 bg-[#0F9D8A] hover:bg-[#0d8575] text-white rounded text-[10px] font-bold shadow-2xs transition shrink-0"
                  >
                    Enter Analytical Observations
                  </button>
                </div>
              ))}
              {samples.filter(s => s.status === 'Testing' || s.status === 'Result Entered').length === 0 && (
                <p className="py-8 text-center text-slate-400 font-medium">No samples currently marked inside analytical testing phase.</p>
              )}
            </div>
          </div>

          {/* Quick instructions panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-2">
              <Activity size={14} className="text-[#0F9D8A]" />
              <span>Titration & ICP Calibration</span>
            </h4>
            <div className="text-xs text-slate-500 leading-relaxed space-y-3">
              <p>1. Ensure Sartorius pH Meter (EQ-01) is fully calibrated prior to testing acid matrices.</p>
              <p>2. Keep microbiological plating agar locked in cooled compartments when not incubated.</p>
              <p>3. Report critical values (coliform counts & lead spikes) immediately to Director.</p>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CERTIFY SIGN-OFF TAB */}
      {activeLimsTab === 'reports' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
            <Award size={16} className="text-[#2563EB]" />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Authorized Signing Desk (NABL Certification)</h3>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">Sample Specimen</th>
                  <th className="py-2.5 px-4">Customer Depositor</th>
                  <th className="py-2.5 px-4">Physical Status</th>
                  <th className="py-2.5 px-4 text-center">NABL Signature sealing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {samples.filter(s => s.status === 'Result Entered' || s.status === 'Under Review' || s.status === 'Report Ready').map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/30">
                    <td className="py-3 px-4 font-mono">
                      <div>
                        <span className="font-bold text-slate-900">{s.sampleCode}</span>
                        <p className="font-bold text-slate-800 mt-1">{s.sampleName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{s.partyName}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {s.status === 'Report Ready' ? (
                        <div className="flex items-center justify-center space-x-2.5">
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-100">
                            <Check size={12} />
                            <span>DIGITALLY SIGNED</span>
                          </span>
                          <button
                            onClick={() => setPrintingSampleReport(s)}
                            className="p-1 text-slate-500 hover:text-[#0F9D8A] hover:bg-slate-100 rounded border border-slate-200 transition"
                            title="Print Certified Report"
                          >
                            <Printer size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onApproveReport(s.id, 'Dr. Richard Feynman (NABL Officer)')}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] transition shadow-2xs"
                        >
                          Seal & Authorize Signatures
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {samples.filter(s => s.status === 'Result Entered' || s.status === 'Under Review' || s.status === 'Report Ready').length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 font-semibold">
                      No assay findings currently ready for certified signing reviews.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SAMPLE DETAIL LOGS MODAL */}
      {viewingSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setViewingSample(null)} />
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full relative z-10 overflow-hidden text-xs">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider font-mono">Sample Intake Details & Custody Logs</h4>
              <button onClick={() => setViewingSample(null)} className="text-white text-lg">&times;</button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Main fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Sample Code</span>
                  <p className="font-mono font-black text-slate-900">{viewingSample.sampleCode}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer depositors</span>
                  <p className="font-bold text-slate-800">{viewingSample.partyName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Matrix classification</span>
                  <p className="font-semibold text-slate-700">{viewingSample.sampleName} ({viewingSample.sampleType})</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Storage compartment</span>
                  <p className="font-semibold text-slate-700">{viewingSample.storageLocation}</p>
                </div>
              </div>

              {/* Custody timeline sequence */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-3">Custody Logs Sequence</span>
                <div className="space-y-4 relative pl-4 border-l border-slate-200 ml-1">
                  {viewingSample.timeline?.map((log, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-teal-500 border-2 border-white" />
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800">{log.label || log.status}</p>
                          <span className="font-mono text-[9px] text-slate-400">{log.timestamp}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Approved Officer: {log.user}</p>
                        {log.description && <p className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-2 rounded">{log.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKSHEET RESULTS DIALOG */}
      {editingResultsSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setEditingResultsSample(null)} />
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full relative z-10 overflow-hidden text-xs">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider">Fill Analytical Test findings</h4>
              <button onClick={() => setEditingResultsSample(null)} className="text-white text-lg">&times;</button>
            </div>

            <form onSubmit={handleSaveAssayResults} className="p-5 space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Sample Code</span>
                <p className="font-mono font-bold text-slate-800 text-xs">{editingResultsSample.sampleCode}</p>
              </div>

              {/* Parameters input list */}
              <div className="space-y-3">
                <p className="font-bold text-slate-700">Test Assay Results values:</p>
                {paramResults.map((param, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-800">{param.name}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Reference: Absent</p>
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Result value..."
                        value={param.val}
                        onChange={(e) => {
                          const updated = [...paramResults];
                          updated[index].val = e.target.value;
                          updated[index].status = e.target.value.toLowerCase().includes('abnormal') || Number(e.target.value) > 0 ? 'Abnormal' : 'Normal';
                          setParamResults(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Technician Analyst Notes</label>
                <textarea
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="e.g. Duplicates checked, E.coli culture plates are positive."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingResultsSample(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F9D8A] hover:bg-[#0d8575] text-white font-bold rounded-lg"
                >
                  Post Observations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printingSampleReport && (
        <DocumentPrintView
          documentType="report"
          data={printingSampleReport}
          settings={settings}
          onClose={() => setPrintingSampleReport(null)}
        />
      )}
    </div>
  );
}
