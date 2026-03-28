import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { CATEGORIES, formatINR } from '../utils/constants';
import Tesseract from 'tesseract.js';

export const AddExpenseTab = ({ transactions, addTransaction, deleteTransaction, addTransactionsBatch, addToast }) => {
    const [newTxn, setNewTxn] = useState({ amount: '', date: new Date().toISOString().split('T')[0], desc: '', category: 'Food' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    
    // Advanced Search & Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterDate, setFilterDate] = useState('All Time');

    const handleManual = async (e) => {
        e.preventDefault();
        if(!newTxn.amount || !newTxn.desc) { addToast('Please fill all fields', 'error'); return; }
        
        setIsSubmitting(true);
        const { error } = await addTransaction({ 
            amount: parseFloat(newTxn.amount), 
            date: newTxn.date, 
            description: newTxn.desc, 
            category: newTxn.category 
        });
        
        setIsSubmitting(false);
        if (error) {
            addToast(`Network Error: ${error.message}`, 'error');
        } else {
            setNewTxn({...newTxn, amount: '', desc: ''});
            addToast('Transaction securely added to database!');
        }
    };

    const handleCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = async (evt) => {
            try {
                const lines = evt.target.result.split('\n').filter(l => l.trim().length > 0);
                if (lines.length < 2) throw new Error("File empty or missing data rows.");
                
                const acc = [];
                for(let i=1; i<lines.length; i++) {
                    const c = lines[i].split(',');
                    if(c.length >= 4) {
                        acc.push({ date: c[0].trim(), description: c[1].trim(), amount: parseFloat(c[2].trim())||0, category: c[3].trim()||'Other' });
                    }
                }
                
                addToast("Uploading CSV to cloud...");
                const { error } = await addTransactionsBatch(acc);
                if (error) throw error;
                addToast(`Successfully imported ${acc.length} transactions via CSV!`);
            } catch(err) {
                addToast(`CSV Error: ${err.message}`, 'error');
            }
        };
        r.readAsText(file);
        e.target.value = null;
    };

    const handleAIOpticalScan = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        setIsScanning(true);
        addToast("🤖 Neural Vision analyzing receipt. This may take 10-15 seconds securely on your device.", "success");

        try {
            const { data: { text } } = await Tesseract.recognize(file, 'eng');
            
            // Regex finding $ or Rs values loosely or properly formatted amounts
            const matches = text.match(/\d+[\.,]\d{2}/g);
            let maxAmt = 0;
            if (matches) {
                maxAmt = Math.max(...matches.map(m => parseFloat(m.replace(',','.'))));
            }
            if (maxAmt > 0) {
                setNewTxn(prev => ({ ...prev, amount: maxAmt, desc: 'AI Scanned Receipt', category: 'Shopping' }));
                addToast(`🧠 AI Logic Extracted Total: ${formatINR(maxAmt)}. Please meticulously verify results!`, "success");
            } else {
                addToast("❌ Neural vision failed to reliably isolate the total sum from this graphic.", "error");
            }
        } catch (err) {
            addToast(`AI Scan failure: ${err.message}`, 'error');
        } finally {
            setIsScanning(false);
        }
        e.target.value = null;
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Search Rule
            const matchSearch = searchTerm === '' || 
                                t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                formatINR(t.amount).includes(searchTerm);
            
            // Category Rule
            const matchCat = filterCategory === 'All' || t.category === filterCategory;

            // Date Rule
            const tDate = new Date(t.date);
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            let matchDate = true;
            if (filterDate === 'This Month') matchDate = tDate >= startOfMonth;
            if (filterDate === 'Last Month') {
                const startLast = new Date(now.getFullYear(), now.getMonth()-1, 1);
                matchDate = tDate >= startLast && tDate < startOfMonth;
            }
            if (filterDate === 'This Year') {
                const startYear = new Date(now.getFullYear(), 0, 1);
                matchDate = tDate >= startYear;
            }

            return matchSearch && matchCat && matchDate;
        });
    }, [transactions, searchTerm, filterCategory, filterDate]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="font-serif text-xl mb-4">Manual Entry</h3>
                    <form onSubmit={handleManual} className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1 text-gray-500 font-bold uppercase tracking-wider">Amount</label>
                            <input type="number" step="0.01" required value={newTxn.amount} onChange={e=>setNewTxn({...newTxn, amount: e.target.value})} className="w-full p-2.5 rounded-xl placeholder:text-gray-300 dark:placeholder:text-gray-600 outline-none" placeholder="₹0" disabled={isSubmitting} />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-gray-500 font-bold uppercase tracking-wider">Date</label>
                            <input type="date" required value={newTxn.date} onChange={e=>setNewTxn({...newTxn, date: e.target.value})} className="w-full p-2.5 rounded-xl outline-none" disabled={isSubmitting} />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-gray-500 font-bold uppercase tracking-wider">Description</label>
                            <input type="text" required value={newTxn.desc} onChange={e=>setNewTxn({...newTxn, desc: e.target.value})} className="w-full p-2.5 rounded-xl placeholder:text-gray-300 dark:placeholder:text-gray-600 outline-none" placeholder="E.g. Groceries" disabled={isSubmitting} />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-gray-500 font-bold uppercase tracking-wider">Category</label>
                            <select required value={newTxn.category} onChange={e=>setNewTxn({...newTxn, category: e.target.value})} className="w-full p-2.5 rounded-xl outline-none" disabled={isSubmitting}>
                                {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <button disabled={isSubmitting} className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-md ${isSubmitting ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-primary to-[#8e73ff] text-white hover:shadow-lg hover:-translate-y-0.5'}`}>
                            {isSubmitting ? 'Syncing...' : 'Add Transaction'}
                        </button>
                    </form>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="card text-center flex flex-col items-center justify-center border-dashed border-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-primary/50 transition h-full min-h-[200px]">
                        <div className="w-14 h-14 bg-gradient-to-tr from-primary to-[#8e73ff] rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-primary/20"><Icon name="upload" color="#fff" className="w-6 h-6"/></div>
                        <h3 className="font-serif text-lg mb-1 font-bold">CSV Bulk Upload</h3>
                        <p className="text-xs text-gray-500 mb-4 px-6">date, description, amount, category</p>
                        <label className="cursor-pointer px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold hover:shadow-md transition shadow-sm uppercase text-xs tracking-wider">
                            Select CSV
                            <input type="file" accept=".csv" className="hidden" onChange={handleCSV}/>
                        </label>
                    </div>

                    <div className="card text-center flex flex-col items-center justify-center border-dashed border-2 bg-gradient-to-tr from-[#00d4aa]/5 to-transparent backdrop-blur-sm border-[#00d4aa]/30 hover:border-[#00d4aa] transition h-full min-h-[200px] relative overflow-hidden">
                        {isScanning && <div className="absolute inset-0 bg-[#00d4aa]/10 animate-pulse"></div>}
                        <div className="w-14 h-14 bg-gradient-to-br from-[#00d4aa] to-teal-700 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-[#00d4aa]/20 z-10"><Icon name="activity" color="#fff" className="w-6 h-6"/></div>
                        <h3 className="font-serif text-lg mb-1 font-bold z-10 flex items-center gap-2">AI Receipt Scanner <span className="bg-[#00d4aa] text-white text-[10px] px-1.5 rounded uppercase tracking-wider font-bold">BETA</span></h3>
                        <p className="text-xs text-gray-500 mb-4 px-6 z-10">Neural Vision extracts total amounts automatically from receipt pictures directly on your device.</p>
                        <label className={`cursor-pointer px-6 py-2.5 bg-white dark:bg-gray-700 border border-[#00d4aa]/30 rounded-xl font-bold hover:shadow-md transition shadow-sm uppercase text-xs tracking-wider z-10 ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}>
                            {isScanning ? 'Scanning...' : 'Extract Image'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleAIOpticalScan} disabled={isScanning}/>
                        </label>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="font-serif text-xl font-bold whitespace-nowrap">Transaction Ledger</h3>
                    
                    {/* Advanced Search & Filtering Bar */}
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                        <div className="relative">
                            <input type="text" placeholder="Search entries..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 w-full sm:w-48 text-sm outline-none rounded-lg" />
                            <Icon name="search" className="w-4 h-4 absolute left-3 top-2.5 text-gray-400"/>
                        </div>
                        <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} className="py-2 pl-3 pr-8 text-sm outline-none rounded-lg cursor-pointer">
                            <option value="All">All Categories</option>
                            {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="py-2 pl-3 pr-8 text-sm outline-none rounded-lg cursor-pointer">
                            <option value="All Time">All Time</option>
                            <option value="This Month">This Month</option>
                            <option value="Last Month">Last Month</option>
                            <option value="This Year">This Year</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/40 backdrop-blur-md">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 tracking-wider">
                                <th className="p-4 font-bold uppercase text-xs">Date</th>
                                <th className="p-4 font-bold uppercase text-xs">Description</th>
                                <th className="p-4 font-bold uppercase text-xs">Category</th>
                                <th className="p-4 font-bold uppercase text-xs text-right">Amount</th>
                                <th className="p-4 font-bold uppercase text-xs text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(t => (
                                <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800/80 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-all font-medium">
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{t.date}</td>
                                    <td className="p-4 text-gray-900 dark:text-white font-bold">{t.description}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-xs font-bold">
                                            <span className="w-2 h-2 rounded-full shadow-inner" style={{backgroundColor: CATEGORIES[t.category]?.color||'#000'}}></span> {t.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-900 dark:text-white tabular-nums">{formatINR(t.amount)}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={async ()=>{
                                            const { error } = await deleteTransaction(t.id);
                                            if (error) addToast(`Deletion failed: ${error.message}`, 'error');
                                            else addToast('Transaction permanently deleted.');
                                        }} className="text-gray-400 hover:text-red-500 transition p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm"><Icon name="trash" className="w-4 h-4 mx-auto"/></button>
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length===0 && <tr><td colSpan="5" className="p-10 text-center text-gray-500 font-medium">No records match your strict search criteria!</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
