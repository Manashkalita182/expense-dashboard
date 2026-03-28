import React from 'react';
import { CustomChart } from '../components/CustomChart';
import { Icon } from '../components/Icon';
import { formatINR, getMonthId, getMonthName } from '../utils/constants';

export const ForecastTab = ({ transactions, isDark, settings }) => {
    const last6Months = [];
    for(let i=5; i>=0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); last6Months.push({ mId: getMonthId(d), label: getMonthName(getMonthId(d)) }); }
    const actualSpend = last6Months.map(m => transactions.filter(t => getMonthId(new Date(t.date)) === m.mId).reduce((s,t)=>s+t.amount, 0));
    const avgSpend = actualSpend.length ? actualSpend.reduce((a,b)=>a+b,0) / actualSpend.length : 0;
    
    const next6Months = [];
    const projectedSpend = [];
    let currentProj = avgSpend;
    for(let i=1; i<=6; i++) {
        const d = new Date(); d.setMonth(d.getMonth() + i);
        next6Months.push(getMonthName(getMonthId(d)));
        currentProj *= 1.02; // 2% growth per month assumption
        projectedSpend.push(currentProj);
    }

    const labels = [...last6Months.map(m=>m.label), ...next6Months];
    const actualData = [...actualSpend, null, null, null, null, null, null];
    const projData = [null, null, null, null, null, actualSpend[5], ...projectedSpend]; 

    const savingRate = ((settings.monthlyIncome - avgSpend) / settings.monthlyIncome) * 100;

    const config = {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Actual', data: actualData, borderColor: '#6c47ff', backgroundColor: '#6c47ff', fill: false, tension: 0.3, borderWidth: 3, pointBackgroundColor: '#fff', pointBorderWidth: 2, pointRadius: 4 },
                { label: 'Projected', data: projData, borderColor: '#00d4aa', borderDash: [6, 4], fill: false, tension: 0.3, borderWidth: 3, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                y: { beginAtZero: true, grid: { color: isDark ? '#374151' : '#e5e7eb' }, ticks: { color: isDark ? '#9ca3af' : '#6b7280' } },
                x: { grid: { display: false }, ticks: { color: isDark ? '#9ca3af' : '#6b7280' } } 
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-xl">12-Month Projection</h3>
                    <div className="flex gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-2"><span className="w-3 h-1 bg-[#6c47ff] rounded-full"></span> Actual</span>
                        <span className="flex items-center gap-2 text-[#00d4aa]">--- Projected</span>
                    </div>
                </div>
                <CustomChart config={config} height="320px" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card flex flex-col justify-center text-center py-8">
                    <div className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 font-medium">Monthly Income Config</div>
                    <div className="text-3xl font-serif text-gray-900 dark:text-white">{formatINR(settings.monthlyIncome)}</div>
                </div>
                <div className="card flex flex-col justify-center text-center py-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[#00d4aa]/5 transition-colors group-hover:bg-[#00d4aa]/10"></div>
                    <div className="relative z-10">
                        <div className="text-xs uppercase tracking-widest text-gray-500 border-[#00d4aa] mb-2 font-medium">Avg Saving Rate</div>
                        <div className="text-3xl font-serif text-[#00d4aa]">{Math.max(0, savingRate).toFixed(1)}%</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#6c47ff] to-[#5135cc] rounded-[14px] p-6 shadow-lg flex flex-col justify-center text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><Icon name="activity" className="w-24 h-24"/></div>
                    <div className="relative z-10">
                        <div className="text-xs uppercase tracking-widest text-white/80 mb-2 font-medium">Recommended Save (20%)</div>
                        <div className="text-3xl font-serif">{formatINR(settings.monthlyIncome * 0.20)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
