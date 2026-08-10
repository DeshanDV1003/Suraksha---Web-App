import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { CreditCard, Package, Clock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";

export const DonationsPage = () => {
  const { t } = useTranslation();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await api.get('/donations');
      setDonations(response.data);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error(t('donations_page.failed_load'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/donations/${id}/status`, { status });
      toast.success(t('donations_page.status_updated'));
      fetchDonations();
    } catch (error) {
      toast.error(t('donations_page.failed_update'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'bg-green-500/15 text-green-400 border-green-500/30';
      case 'ALLOCATED': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default: return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    }
  };

  const totalMonetary = donations
    .filter(d => d.type === 'MONETARY' && d.status !== 'PENDING')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const statCards = [
    {
      icon: CreditCard,
      label: t('donations_page.total_funds'),
      value: `LKR ${totalMonetary.toLocaleString()}`,
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
    },
    {
      icon: Package,
      label: t('donations_page.material_donations'),
      value: `${donations.filter(d => d.type === 'MATERIAL').length} ${t('donations_page.items')}`,
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
    },
    {
      icon: Clock,
      label: t('donations_page.pending_approvals'),
      value: donations.filter(d => d.status === 'PENDING').length,
      iconBg: 'bg-yellow-500/15',
      iconColor: 'text-yellow-400',
    },
  ];

  return (
    <>
      <PageMeta title="Donations | Suraksha" description="Suraksha Donations Page" />
      <PageBreadcrumb pageTitle={t('donations_page.page_title')} />
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card) => (
            <div key={card.label} className="suraksha-card p-6 rounded-2xl flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.iconBg}`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white/90 mt-0.5">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="suraksha-card rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white/90">{t('donations_page.recent_donations')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-[#0e1d36] border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t('donations_page.donor')}</th>
                  <th className="px-6 py-4 font-semibold">{t('donations_page.type')}</th>
                  <th className="px-6 py-4 font-semibold">{t('donations_page.details')}</th>
                  <th className="px-6 py-4 font-semibold">{t('donations_page.gateway_ref')}</th>
                  <th className="px-6 py-4 font-semibold">{t('donations_page.status')}</th>
                  <th className="px-6 py-4 font-semibold">{t('donations_page.date')}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t('donations_page.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">{t('donations_page.loading')}</td>
                  </tr>
                ) : donations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">{t('donations_page.no_donations')}</td>
                  </tr>
                ) : (
                  donations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white/90">{d.donorName || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          d.type === 'MONETARY'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                        }`}>
                          {d.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {d.type === 'MONETARY' ? `LKR ${d.amount?.toLocaleString()}` : d.itemsDescription}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {d.paymentGateway ? `${d.paymentGateway} (${d.transactionId})` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap text-xs">
                        {format(new Date(d.createdAt), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={d.status}
                          onChange={(e) => handleStatusChange(d.id, e.target.value)}
                          className="suraksha-input text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          <option value="PENDING">{t('donations_page.pending')}</option>
                          <option value="RECEIVED">{t('donations_page.received')}</option>
                          <option value="ALLOCATED">{t('donations_page.allocated')}</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
