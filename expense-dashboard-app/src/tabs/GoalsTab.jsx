import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { CATEGORIES, formatINR, getMonthId } from '../utils/constants';

export const GoalsTab = ({ transactions, goals, settings, addGoal, deleteGoal, updateGoalSaved, addToast }) => {
    const [newGoal, setNewGoal] = useState({ name: '', target: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const currentMonthId = getMonthId(new Date());
    const currentTxns = transactions.filter(t => getMonthId(new Date(t.date)) === currentMonthId);
    const categorySpend = {};
    currentTxns.forEach(t => categorySpend[t.category] = (categorySpend[t.category]||0) + t.amount);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card flex flex-col">
                <h3 className="font-serif text-xl mb-6">Savings Goals</h3>
                <div className="space-y-6 flex-1">
                    {goals.map(g => {
                        const pct = (g.saved / g.target) * 100;
                        return (
                            <div key={g.id} className="relative group">
                                <button onClick={async ()=>{
                                    const { error } = await deleteGoal(g.id);
                                    if(error) addToast('Error deleting goal.', 'error');
                                    else addToast('Goal permanently deleted.');
                                }} className="absolute -top-2 -right-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon name="trash" className="w-4 h-4"/>
                                </button>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <h4 className="font-medium text-lg text-gray-900 dark:text-white pr-4">{g.name}</h4>
                                        <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Saved {formatINR(g.saved)} of {formatINR(g.target)}</div>
                                    </div>
                                    <div className="text-sm font-bold text-[#00d4aa] bg-[#00d4aa]/10 px-2.5 py-1 rounded">
                                        {formatINR(Math.max(0, g.target - g.saved))} left
                                    </div>
                                </div>
                                <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer" onClick={async ()=>{
                                    const addAmt = prompt(`Add savings to ${g.name}:`, "1000");
                                    if(addAmt && !isNaN(addAmt)) {
                                        const { error } = await updateGoalSaved(g.id, Math.min(g.target, g.saved + parseFloat(addAmt)));
                                        if (error) addToast('Failed to update goal.', 'error');
                                        else addToast(`Added ${formatINR(addAmt)} to goal ${g.name}`);
                                    }
                                }}>
                                    <div className="h-full bg-gradient-to-r from-primary to-[#00d4aa] rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, pct)}%`}}></div>
                                </div>
                            </div>
                        );
                    })}
                    {goals.length === 0 && <div className="text-center p-8 text-gray-500 text-sm">No active goals. Add one below.</div>}
                </div>
                <form className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6" onSubmit={async e=>{
                    e.preventDefault(); 
                    setIsSubmitting(true);
                    const { error } = await addGoal({ name: newGoal.name, target: parseFloat(newGoal.target), saved: 0 });
                    setIsSubmitting(false);
                    if (error) addToast(error.message, 'error');
                    else {
                        setNewGoal({name:'',target:''});
                        addToast("New goal safely synced to cloud!");
                    }
                }}>
                    <h4 className="font-medium mb-3 text-sm text-gray-600 dark:text-gray-400">Add New Goal</h4>
                    <div className="flex gap-2">
                        <input type="text" placeholder="Name" required value={newGoal.name} onChange={e=>setNewGoal({...newGoal, name: e.target.value})} disabled={isSubmitting} className="flex-1 p-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-lg outline-none focus:border-primary text-sm"/>
                        <input type="number" placeholder="Target" required value={newGoal.target} onChange={e=>setNewGoal({...newGoal, target: e.target.value})} disabled={isSubmitting} className="w-32 p-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-lg outline-none focus:border-primary text-sm"/>
                        <button disabled={isSubmitting} className={`px-5 rounded-lg font-medium text-sm transition ${isSubmitting ? 'bg-gray-400' : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:opacity-90'}`}>Add</button>
                    </div>
                </form>
            </div>

            <div className="card">
                <h3 className="font-serif text-xl mb-6">Per-Category Gauges</h3>
                <div className="space-y-5">
                    {Object.keys(CATEGORIES).map(cat => {
                        const spend = categorySpend[cat] || 0;
                        const categoryBudgetPct = { Food: 0.27, Transport: 0.1, Shopping: 0.2, Health: 0.07, Entertainment: 0.1, Bills: 0.17, Other: 0.09 };
                        const limit = settings.totalBudget * (categoryBudgetPct[cat] || 0.1);
                        
                        const pct = (spend / limit) * 100;
                        let color = "#00d4aa"; // green
                        if (pct >= 80) color = "#ffb347"; // amber
                        if (pct > 100) color = "#ff6b6b"; // red
                        return (
                            <div key={cat}>
                                <div className="flex justify-between items-center mb-1.5 text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{cat}</span>
                                    <span className="font-mono text-xs text-gray-500 leading-none"><span className={pct>100?'text-[#ff6b6b] font-bold':''}>{formatINR(spend)}</span> / {formatINR(limit)}</span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-1000 origin-left" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
