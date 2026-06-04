import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, ShieldCheck, HelpCircle, HeartPulse, Search, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

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
      default: return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE': return 'bg-green-100 text-green-800 border-green-200';
      case 'NEEDS_HELP': return 'bg-red-100 text-red-800 border-red-200';
      case 'INJURED': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'EVACUATED': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Safety Roster</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['ALL', 'NEEDS_ATTENTION', 'SAFE', 'EVACUATED', 'UNKNOWN'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Citizen Check-ins & Families</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search roster..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Primary Citizen</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Primary Status</th>
                <th className="px-6 py-4 font-medium">Last Known Location</th>
                <th className="px-6 py-4 font-medium">Family Members</th>
                <th className="px-6 py-4 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading roster...</td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No citizens found in this category</td>
                </tr>
              ) : (
                filteredRoster.map((user) => {
                  const checkIn = user.latestCheckIn;
                  const status = checkIn?.status || 'UNKNOWN';
                  
                  return (
                    <tr key={user.userId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {user.phone || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {checkIn?.latitude ? `${checkIn.latitude.toFixed(4)}, ${checkIn.longitude.toFixed(4)}` : 'Unknown'}
                        {checkIn?.message && <div className="mt-1 text-slate-400 italic">"{checkIn.message}"</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {user.familyMembers.length === 0 ? (
                            <span className="text-slate-400 text-xs">None registered</span>
                          ) : (
                            user.familyMembers.map((member: any) => (
                              <div key={member.id} className="flex items-center space-x-2 text-xs">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: member.status === 'SAFE' ? '#10b981' : '#ef4444' }}></span>
                                <span className="font-medium">{member.name}</span>
                                <span className="text-slate-400">({member.relation})</span>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                        {checkIn ? format(new Date(checkIn.createdAt), 'MMM d, h:mm a') : 'Never'}
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
  );
};
