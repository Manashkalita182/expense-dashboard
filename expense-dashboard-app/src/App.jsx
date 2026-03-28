import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDatabase } from './hooks/useDatabase';
import { ToastContainer } from './components/ToastContainer';
import { Icon } from './components/Icon';
import { OverviewTab } from './tabs/OverviewTab';
import { AddExpenseTab } from './tabs/AddExpenseTab';
import { GoalsTab } from './tabs/GoalsTab';
import { ForecastTab } from './tabs/ForecastTab';
import { SettingsTab } from './tabs/SettingsTab';

const App = () => {
    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useLocalStorage('findash_tab_v2', 'Overview');
    const [isDark, setIsDark] = useLocalStorage('findash_theme_v2', true);
    
    // Cloud Database Hook tied to Session User ID
    const { 
        transactions, goals, settings, loading, 
        addTransaction, addTransactionsBatch, deleteTransaction, 
        addGoal, deleteGoal, updateGoalSaved, 
        updateSettings, resetDatabase 
    } = useDatabase(session);
    
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    // Session Management
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
        return () => subscription.unsubscribe();
    }, []);

    // Dark Mode Wrapper
    useEffect(() => { 
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDark]);

    // Dynamic Database Theme Observer
    useEffect(() => {
        if (settings?.theme_color) {
            document.documentElement.style.setProperty('--color-primary', settings.theme_color);
        } else {
            document.documentElement.style.setProperty('--color-primary', '#6c47ff');
        }
    }, [settings?.theme_color]);

    if (!session) {
        return <Auth />;
    }

    const tabs = [
        { id: 'Overview', icon: 'activity' },
        { id: 'Add Expense', icon: 'file-text' },
        { id: 'Goals', icon: 'sun' },
        { id: 'Forecast', icon: 'film' },
        { id: 'Settings', icon: 'settings' },
    ];

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            <ToastContainer toasts={toasts} />
            
            <aside className="w-full md:w-[280px] bg-white dark:bg-[#0b0a10] border-r border-gray-200 dark:border-[#22202f] flex-shrink-0 flex flex-col shadow-sm relative z-20">
                <div className="p-6 md:p-8 flex justify-between items-center md:block">
                    {/* User Profile Avatar / Logo Display */}
                    <div className="mb-8 hidden md:flex items-center gap-3">
                        {settings?.avatar_url ? (
                            <img src={settings.avatar_url} alt="Profile" className="w-11 h-11 rounded-full object-cover border border-[#22202f]" />
                        ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-[#8e73ff] flex items-center justify-center text-white font-bold text-lg">
                                {session.user.user_metadata?.full_name?.charAt(0) || <Icon name="user" className="w-5 h-5"/>}
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-[#1a1725] px-2 py-0.5 rounded w-max mb-1">PRO</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate w-32">{session.user.user_metadata?.full_name || 'My Vault'}</span>
                        </div>
                    </div>

                    <h1 className="font-serif text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#00d4aa] flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-[#8e73ff] flex items-center justify-center shadow-md shadow-primary/20 md:hidden">
                            <Icon name="activity" color="#fff" />
                        </div>
                        <span className="md:hidden">FinDash.</span>
                    </h1>
                    <button onClick={()=>setIsDark(!isDark)} className="md:hidden p-2 text-gray-500 bg-white/50 dark:bg-gray-700/50 rounded-full backdrop-blur-md border border-white/20 dark:border-gray-600/50">
                        <Icon name={isDark ? "sun" : "moon"}/>
                    </button>
                </div>
                
                <nav className="flex md:flex-col gap-2 px-4 pb-4 md:pb-0 md:px-6 overflow-x-auto no-scrollbar pt-2">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                            className={`px-4 py-3 md:py-3.5 rounded-2xl text-left whitespace-nowrap font-bold transition-all duration-300 flex items-center gap-4 text-sm cursor-pointer ${
                                activeTab === tab.id 
                                ? 'bg-gray-900 text-white dark:bg-[#f4f4f5] dark:text-[#0b0a10] shadow-md scale-[1.02]' 
                                : 'text-gray-500 dark:text-[#8a8a93] hover:bg-gray-100 dark:hover:bg-[#13121a] hover:text-gray-900 dark:hover:text-[#f4f4f5]'
                            }`}>
                            <Icon name={tab.icon} className="w-5 h-5"/>
                            {tab.id}
                        </button>
                    ))}
                </nav>
                
                <div className="mt-auto hidden md:flex flex-col p-6 gap-2 border-t border-gray-200 dark:border-[#22202f]">
                    <button onClick={()=>setIsDark(!isDark)} className="flex items-center gap-3 text-sm font-bold text-gray-500 dark:text-[#8a8a93] hover:text-gray-900 dark:hover:text-white transition w-full p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-[#13121a]">
                        <Icon name={isDark ? "sun" : "moon"} /> {isDark ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button onClick={()=>supabase.auth.signOut()} className="flex items-center gap-3 text-sm font-bold text-red-500 dark:text-red-400 hover:text-red-600 transition w-full p-3 rounded-2xl hover:bg-red-50 dark:hover:bg-[#1a1215]">
                        <Icon name="upload" className="rotate-90"/> Logout Safe
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-80px)] md:h-screen w-full relative z-10 transition-colors">
                <div className="max-w-6xl mx-auto pb-20 md:pb-0">
                    <header className="mb-8 mt-2 md:mt-0 flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white">{activeTab}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{
                                activeTab === 'Overview' ? 'Your financial summary at a glance.' :
                                activeTab === 'Add Expense' ? 'Track your recent spendings securely.' :
                                activeTab === 'Goals' ? 'Manage your savings and budget strictly.' :
                                activeTab === 'Settings' ? 'Dashboard configuration and preferences.' :
                                'Data-driven insights for your future.'
                            }</p>
                        </div>
                    </header>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-primary animate-pulse">
                            <Icon name="activity" className="w-12 h-12 mb-3 opacity-50"/>
                            <p className="font-medium text-gray-500">Syncing with Supabase Cloud...</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            {activeTab === 'Overview' && <OverviewTab transactions={transactions} isDark={isDark} settings={settings}/>}
                            {activeTab === 'Add Expense' && <AddExpenseTab transactions={transactions} addTransaction={addTransaction} deleteTransaction={deleteTransaction} addTransactionsBatch={addTransactionsBatch} addToast={addToast}/>}
                            {activeTab === 'Goals' && <GoalsTab transactions={transactions} goals={goals} settings={settings} addGoal={addGoal} deleteGoal={deleteGoal} updateGoalSaved={updateGoalSaved} addToast={addToast}/>}
                            {activeTab === 'Forecast' && <ForecastTab transactions={transactions} isDark={isDark} settings={settings}/>}
                            {activeTab === 'Settings' && <SettingsTab settings={settings} updateSettings={updateSettings} resetDatabase={resetDatabase} addToast={addToast}/>}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
