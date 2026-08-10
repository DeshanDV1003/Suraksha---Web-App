import React, { useState, useEffect } from 'react';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';
import { API_URL } from '../lib/env';

interface DownstreamMapping {
  id?: string;
  gaugeId: string;
  riverName: string;
  stationName: string;
  targetDistricts: string[];
}

export default function RiverMappingsPage() {
  const [mappings, setMappings] = useState<DownstreamMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<DownstreamMapping> | null>(null);

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    try {
      const res = await fetch(`${API_URL}/water/downstream-mapping`);
      const data = await res.json();
      setMappings(data);
    } catch (err) {
      console.error('Failed to fetch mappings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      const payload = {
        ...editing,
        targetDistricts: Array.isArray(editing.targetDistricts) 
          ? editing.targetDistricts 
          : (editing.targetDistricts as unknown as string).split(',').map(s => s.trim())
      };
      
      const res = await fetch(`${API_URL}/water/downstream-mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditing(null);
        fetchMappings();
      }
    } catch (err) {
      console.error('Failed to save mapping', err);
    }
  };

  return (
    <div>
      <PageMeta title="River Mappings | Suraksha" description="Manage downstream district mappings for river gauges" />
      <PageBreadcrumb pageTitle="River Mappings" />
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">River to District Mappings</h2>
          <button 
            onClick={() => setEditing({ gaugeId: '', riverName: '', stationName: '', targetDistricts: [] })}
            className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            Add Mapping
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading mappings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Gauge ID</th>
                  <th className="py-3 px-4 font-semibold text-sm text-gray-600 dark:text-gray-300">River</th>
                  <th className="py-3 px-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Station</th>
                  <th className="py-3 px-4 font-semibold text-sm text-gray-600 dark:text-gray-300">Target Districts</th>
                  <th className="py-3 px-4 font-semibold text-sm text-gray-600 dark:text-gray-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m) => (
                  <tr key={m.gaugeId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm font-medium">{m.gaugeId}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{m.riverName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{m.stationName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {m.targetDistricts.map(d => (
                          <span key={d} className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <button 
                        onClick={() => setEditing(m)}
                        className="text-brand-500 hover:text-brand-600 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {mappings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                      No downstream mappings configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold mb-4">{editing.id ? 'Edit Mapping' : 'New Mapping'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gauge ID</label>
                <input 
                  type="text" 
                  value={editing.gaugeId || ''} 
                  onChange={(e) => setEditing({...editing, gaugeId: e.target.value})}
                  disabled={!!editing.id}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-800 dark:border-gray-700 disabled:opacity-50" 
                  placeholder="e.g. RG-KELANI-HANWELLA"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">River Name</label>
                  <input 
                    type="text" 
                    value={editing.riverName || ''} 
                    onChange={(e) => setEditing({...editing, riverName: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-800 dark:border-gray-700" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Station Name</label>
                  <input 
                    type="text" 
                    value={editing.stationName || ''} 
                    onChange={(e) => setEditing({...editing, stationName: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-800 dark:border-gray-700" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Districts (comma separated)</label>
                <input 
                  type="text" 
                  value={Array.isArray(editing.targetDistricts) ? editing.targetDistricts.join(', ') : editing.targetDistricts || ''} 
                  onChange={(e) => setEditing({...editing, targetDistricts: e.target.value as unknown as string[]})}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:bg-gray-800 dark:border-gray-700" 
                  placeholder="Colombo, Gampaha, Kalutara"
                />
                <p className="text-xs text-gray-500 mt-1">These districts will receive alerts when this gauge crosses thresholds.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setEditing(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 font-medium transition-colors"
              >
                Save Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
