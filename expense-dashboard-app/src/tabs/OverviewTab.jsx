import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { CustomChart } from '../components/CustomChart';
import { CATEGORIES, formatINR, getMonthId } from '../utils/constants';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const OverviewTab = ({ transactions, isDark, settings }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    // Filter current month
    const now = new Date();
    const currentMonthId = getMonthId(now);
    const thisMonthTxns = transactions.filter(t => getMonthId(new Date(t.date)) === currentMonthId);
    
    // Metrics
    const totalSpent = thisMonthTxns.reduce((sum, t) => sum + t.amount, 0);
    const currentBudget = settings.totalBudget;
    const remainingBudget = Math.max(0, currentBudget - totalSpent);
    const budgetPct = Math.min(100, (totalSpent / currentBudget) * 100);

    // Category Breakdowns
    const categoryTotals = {};
    Object.keys(CATEGORIES).forEach(c => categoryTotals[c] = 0);
    thisMonthTxns.forEach(t => categoryTotals[t.category] += t.amount);

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const element = document.getElementById('dashboard-metrics');
            const canvas = await html2canvas(element, { 
                scale: 2, 
                backgroundColor: isDark ? '#0f111a' : '#fafafa',
                useCORS: true 
            });
            const imgData = canvas.toDataURL('image/png');
            
            // A4 page setup
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`FinDash_Report_${currentMonthId}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF snapshot.", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#00d4aa]">Monthly Synopsis</h3>
                <button 
                    onClick={generatePDF} 
                    disabled={isGenerating}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}
                >
                    <Icon name="download" className="w-4 h-4 text-primary" />
                    {isGenerating ? 'Compiling PDF...' : 'Export PDF System'}
                </button>
            </div>

            <div id="dashboard-metrics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card group hover:border-primary/30">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800/80 flex items-center justify-center font-bold text-lg shadow-sm">💰</div>
                            <h3 className="font-bold text-gray-500 tracking-wide uppercase text-xs">Total Spent</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{formatINR(totalSpent)}</p>
                        <p className="text-sm font-medium text-gray-400 mt-2">This Month ({now.toLocaleString('default', { month: 'long' })})</p>
                    </div>
                    <div className="card group hover:border-primary/50 relative overflow-hidden dark:bg-gradient-to-br dark:from-[#2d1b64] dark:to-[#13121a] dark:border-[#4a2e85]">
                        {/* Glow effect matching the reference exactly */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-[0.03] rounded-full blur-3xl mix-blend-overlay pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary opacity-20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>

                        <div className="flex items-center justify-between mb-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-white/10 flex items-center justify-center font-bold text-lg shadow-sm backdrop-blur-sm dark:text-white border border-gray-200 dark:border-white/10">🎯</div>
                                <h3 className="font-bold text-gray-500 dark:text-[#d0c6f5] tracking-wide uppercase text-xs">Remaining Budget</h3>
                            </div>
                            <span className="text-xs font-bold text-[#00d4aa] dark:text-white bg-[#00d4aa]/10 dark:bg-white/20 px-2.5 py-1 rounded-md backdrop-blur-sm border dark:border-white/10">Healthy</span>
                        </div>
                        <p className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tabular-nums relative z-10 drop-shadow-sm mt-3">{formatINR(remainingBudget)}</p>
                        <div className="w-full bg-gray-100 dark:bg-[#0b0a10]/50 rounded-full h-1.5 mt-5 overflow-hidden relative z-10">
                            <div className="bg-gradient-to-r from-[#00d4aa] to-[#ffb347] dark:from-white dark:to-[#00d4aa] h-1.5 rounded-full transition-all duration-1000 dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${budgetPct}%` }}></div>
                        </div>
                        <p className="text-xs font-bold text-gray-400 dark:text-[#a594df] mt-3 relative z-10 flex items-center justify-between">
                            <span>Contribution Limit</span>
                            <span>{(100-budgetPct).toFixed(1)}% Left</span>
                        </p>
                    </div>
                    <div className="card group hover:border-primary/30">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800/80 flex items-center justify-center font-bold shadow-sm"><Icon name="activity" className="w-5 h-5 text-primary"/></div>
                            <h3 className="font-bold text-gray-500 tracking-wide uppercase text-xs">Transactions</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{thisMonthTxns.length}</p>
                        <p className="text-sm font-medium text-gray-400 mt-2">Entries this period</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card hover:shadow-lg transition-shadow duration-300 group">
                        <h3 className="font-serif text-xl mb-6 font-bold flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <span className="p-1.5 bg-primary/10 rounded-lg text-primary"><Icon name="pie-chart" className="w-5 h-5"/></span> Spending Analysis
                            </span>
                        </h3>
                        <CustomChart config={{
                            type: 'doughnut',
                            data: {
                                labels: Object.keys(categoryTotals).filter(c => categoryTotals[c] > 0),
                                datasets: [{
                                    data: Object.keys(categoryTotals).map(c => categoryTotals[c]).filter(v => v > 0),
                                    backgroundColor: Object.keys(categoryTotals).filter(c => categoryTotals[c] > 0).map(c => CATEGORIES[c].color),
                                    borderWidth: 0,
                                    hoverOffset: 8
                                }]
                            },
                            options: { cutout: '70%', layout: { padding: 10 } }
                        }} height="260px" />
                    </div>

                    <div className="card p-0 overflow-hidden flex flex-col">
                        <div className="p-6 pb-2 border-b border-gray-100 dark:border-gray-800/50">
                            <h3 className="font-serif text-xl font-bold flex items-center gap-2"><Icon name="file-text" className="w-5 h-5 text-primary"/> Recent Activity</h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800/50 overflow-y-auto max-h-96 pr-2 no-scrollbar flex-1 relative">
                            {thisMonthTxns.slice(0, 10).map(t => (
                                <div key={t.id} className="p-4 px-6 my-1 mx-2 rounded-2xl hover:bg-gray-50/80 dark:hover:bg-gray-800/60 transition-all duration-300 flex justify-between items-center group cursor-default hover:shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-700/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                                            <Icon name={CATEGORIES[t.category]?.icon || 'file-text'} className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-base tracking-tight">{t.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">{t.category}</span>
                                                <span className="text-xs text-gray-400 font-medium tracking-wide">• {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm group-hover:shadow-md transition-shadow group-hover:border-primary/20 group-hover:text-primary">{formatINR(t.amount)}</span>
                                </div>
                            ))}
                            {thisMonthTxns.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                                        <Icon name="search" className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-gray-400 font-bold tracking-wide">No activity recorded for this period.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
