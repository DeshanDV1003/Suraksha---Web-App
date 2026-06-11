import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, ShieldCheck, HelpCircle, HeartPulse, Search, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
export const FamilySafetyPage = () => {
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchRoster();
  }, []);

  const fetchRoster = async () => {
    try {
      const response = await api.get('/family/roster');
      setRoster(response.data);
    } catch (error) {
      console.error('Error fetching roster:', error);
      toast.error('Failed to load safety roster');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SAFE': return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'NEEDS_HELP': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'INJURED': return <HeartPulse className="w-5 h-5 text-orange-500" />;
      case 'EVACUATED': return <MapPin className="w-5 h-5 text-blue-500" />;
      default: return <HelpCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE': return 'bg-green-100 text-green-800 border-green-200';
      case 'NEEDS_HELP': return 'bg-red-100 text-red-800 border-red-200';
      case 'INJURED': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'EVACUATED': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 dark:bg-gray-800 text-slate-800 border-gray-200 dark:border-gray-700';
    }
  };

  const filteredRoster = roster.filter(r => {
    if (filter === 'ALL') return true;
    const userStatus = r.latestCheckIn?.status || 'UNKNOWN';
    if (filter === 'NEEDS_ATTENTION') {
      return ['NEEDS_HELP', 'INJURED', 'TRAPPED'].includes(userStatus);
    }
    return userStatus === filter;
  });

  return (
    <>
      <PageMeta title="Family Safety | Suraksha" description="Suraksha Family Safety Page" />
      <PageBreadcrumb pageTitle="Family Safety" />
      <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-10 w-full min-w-0">

      <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-6">
        {['ALL', 'NEEDS_ATTENTION', 'SAFE', 'EVACUATED', 'UNKNOWN'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              filter === f 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800/50'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[1.5rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50/50">
          <h2 className="text-xl font-black text-slate-800">Citizen Check-ins & Families</h2>
          <div className="relative w-64">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input 
              type="text" 
              placeholder="Search roster..." 
              className="w-full pl-12 pr-4 py-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800/50/50 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">Primary Citizen</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">Contact</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">Primary Status</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">Last Known Location</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">Family Members</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Loading roster...</td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No citizens found in this category</td>
                </tr>
              ) : (
                filteredRoster.map((user) => {
                  const checkIn = user.latestCheckIn;
                  const status = checkIn?.status || 'UNKNOWN';
                  
                  return (
                    <tr key={user.userId} className="hover:bg-gray-50 dark:bg-gray-800/50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-gray-800 dark:text-white/90 group-hover:text-blue-500 transition-colors whitespace-nowrap">{user.name}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">{user.phone || '-'}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(status)}
                          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide whitespace-nowrap inline-block uppercase border ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">
                          {checkIn?.latitude ? `${checkIn.latitude.toFixed(4)}, ${checkIn.longitude.toFixed(4)}` : 'Unknown'}
                          {checkIn?.message && <div className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 italic">"{checkIn.message}"</div>}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col space-y-1">
                          {user.familyMembers.length === 0 ? (
                            <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">None registered</span>
                          ) : (
                            user.familyMembers.map((member: any) => (
                              <div key={member.id} className="flex items-center space-x-2 text-sm">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: member.status === 'SAFE' ? '#10b981' : '#ef4444' }}></span>
                                <span className="font-semibold text-gray-600 dark:text-gray-300">{member.name}</span>
                                <span className="text-gray-400 dark:text-gray-500">({member.relation})</span>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {checkIn ? format(new Date(checkIn.createdAt), 'MMM d, h:mm a') : 'Never'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};
