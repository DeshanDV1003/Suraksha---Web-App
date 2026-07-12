import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { reportService } from '../../services/api';

interface ExportReportModalProps {
  onClose: () => void;
}

export default function ExportReportModal({ onClose }: ExportReportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    district: '',
    disasterType: '',
    incidentStatus: '',
    severity: '',
    riverStation: ''
  });

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    try {
      const response = await reportService.exportReport(format, filters);
      
      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const fileExt = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv';
      link.setAttribute('download', `Suraksha_Report_${new Date().toISOString().split('T')[0]}.${fileExt}`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      if (link.parentNode) link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onClose();
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-white dark:border-gray-800 overflow-hidden">
        <div className="p-8 pb-0 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white/90">Export Report</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleExport} className="p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">Export Format</h3>
            <div className="flex gap-4">
              {['pdf', 'excel', 'csv'].map((f) => (
                <label key={f} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value={f}
                    checked={format === f}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-4 h-4 text-brand-500"
                  />
                  <span className="uppercase text-sm font-semibold">{f}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">Filters (Optional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Start Date</label>
                <input 
                  type="date" 
                  className="suraksha-input cursor-pointer" 
                  value={filters.startDate} 
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})} 
                  onClick={(e) => (e.target as HTMLInputElement).showPicker && (e.target as HTMLInputElement).showPicker()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">End Date</label>
                <input 
                  type="date" 
                  className="suraksha-input cursor-pointer" 
                  value={filters.endDate} 
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})} 
                  onClick={(e) => (e.target as HTMLInputElement).showPicker && (e.target as HTMLInputElement).showPicker()}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Severity</label>
                <select className="suraksha-input appearance-none" value={filters.severity} onChange={(e) => setFilters({...filters, severity: e.target.value})}>
                  <option value="">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Status</label>
                <select className="suraksha-input appearance-none" value={filters.incidentStatus} onChange={(e) => setFilters({...filters, incidentStatus: e.target.value})}>
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          <button
            disabled={isExporting}
            className="suraksha-button w-full h-14 flex items-center justify-center gap-2 text-base font-bold"
          >
            {isExporting ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-5 h-5" />
                Generate & Download
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
