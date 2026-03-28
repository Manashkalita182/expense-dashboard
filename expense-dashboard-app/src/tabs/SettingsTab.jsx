import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Icon } from '../components/Icon';

export const SettingsTab = ({ settings, updateSettings, resetDatabase, addToast }) => {
    const [localSettings, setLocalSettings] = useState({
        totalBudget: settings?.totalBudget || 29000,
        monthlyIncome: settings?.monthlyIncome || 45000,
        theme_color: settings?.theme_color || '#6c47ff',
        avatar_url: settings?.avatar_url || '',
        full_name: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setLocalSettings(prev => ({
            ...prev,
            totalBudget: settings?.totalBudget || 29000,
            monthlyIncome: settings?.monthlyIncome || 45000,
            theme_color: settings?.theme_color || '#6c47ff',
            avatar_url: settings?.avatar_url || ''
        }));
        
        // Grab the user name async safely
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setLocalSettings(p => ({ ...p, full_name: user.user_metadata?.full_name || '' }));
        });
    }, [settings]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Update name cleanly across the Cloud identity layer
        if (localSettings.full_name) {
            await supabase.auth.updateUser({ data: { full_name: localSettings.full_name } });
        }

        const { error } = await updateSettings({
            total_budget: parseFloat(localSettings.totalBudget),
            monthly_income: parseFloat(localSettings.monthlyIncome),
            theme_color: localSettings.theme_color
        });
        setIsSubmitting(false);
        
        if (error) addToast(`Failed to save: ${error.message}`, 'error');
        else addToast("Profile globally synchronized!", "success");
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsSubmitting(true);
        addToast("Uploading your avatar to Supabase Storage...", "success");

        const { data: { user } } = await supabase.auth.getUser();
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error } = await supabase.storage.from('avatars').upload(filePath, file);
        if (error) {
            addToast(`Upload failed: ${error.message}`, 'error');
            setIsSubmitting(false);
            return;
        }
        
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        
        const { error: dbError } = await updateSettings({ avatar_url: publicUrl });
        
        setIsSubmitting(false);
        if (dbError) addToast('Failed to save avatar URL to profile.', 'error');
        else addToast("Avatar updated globally!", "success");
    };

    const handleReset = async () => {
        const confirm1 = window.confirm("Are you sure you want to completely erase all your transactions and goals? This action cannot be undone.");
        if(confirm1) {
            const confirm2 = window.prompt("Type 'DELETE' to confirm database wipe.");
            if (confirm2 === "DELETE") {
                await resetDatabase();
                addToast("All database entries securely wiped from cloud.", 'error');
            }
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Profile Preferences */}
                <div className="card">
                    <h3 className="font-serif text-xl mb-6 font-bold flex items-center gap-2"><Icon name="user" className="w-5 h-5 text-primary"/> Profile Setup</h3>
                    
                    <div className="flex flex-col items-center mb-6">
                        {localSettings.avatar_url ? (
                            <img src={localSettings.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover mb-3 shadow-[0px_4px_20px_rgba(0,0,0,0.1)] border border-gray-200 dark:border-gray-700" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3 border border-dashed border-gray-300 dark:border-gray-600">
                                <Icon name="image" className="w-8 h-8 text-gray-400"/>
                            </div>
                        )}
                        <label className="cursor-pointer px-5 py-2 text-sm font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition">
                            Upload Photo
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isSubmitting}/>
                        </label>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800/80 pt-5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Dashboard Theme Color</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={localSettings.theme_color} onChange={e=>setLocalSettings({...localSettings, theme_color: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0" disabled={isSubmitting}/>
                            <span className="text-gray-600 dark:text-gray-300 font-mono text-sm uppercase">{localSettings.theme_color}</span>
                        </div>
                    </div>
                </div>

                {/* Financial Config */}
                <div className="card">
                    <h3 className="font-serif text-xl mb-6 font-bold flex items-center gap-2"><Icon name="settings" className="w-5 h-5 text-primary"/> Financial Config</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Display Name</label>
                            <input type="text" value={localSettings.full_name} onChange={e=>setLocalSettings({...localSettings, full_name: e.target.value})} disabled={isSubmitting} className="w-full p-3 rounded-xl outline-none" placeholder="Your Name" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Monthly Income Target</label>
                            <input type="number" required value={localSettings.monthlyIncome} onChange={e=>setLocalSettings({...localSettings, monthlyIncome: e.target.value})} disabled={isSubmitting} className="w-full p-3 rounded-xl outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Max Master Budget</label>
                            <input type="number" required value={localSettings.totalBudget} onChange={e=>setLocalSettings({...localSettings, totalBudget: e.target.value})} disabled={isSubmitting} className="w-full p-3 rounded-xl outline-none" />
                        </div>
                        <button disabled={isSubmitting} className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-md ${isSubmitting ? 'bg-gray-400 text-white' : 'bg-gradient-to-r from-primary to-[#8e73ff] text-white hover:shadow-lg hover:-translate-y-0.5'}`}>Update Parameters</button>
                    </form>
                </div>
            </div>

            {/* PRO Subscription Banner */}
            <div className="card border dark:border-[#8e73ff]/30 bg-gradient-to-br from-[#1a1825] to-[#2d1b64] relative overflow-hidden group">
                {/* Glow effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d4aa] opacity-[0.05] blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8e73ff] opacity-[0.1] blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>
                
                <h3 className="font-serif text-2xl mb-2 font-bold flex items-center gap-3 text-white relative z-10"><Icon name="star" className="w-6 h-6 text-[#00d4aa]"/> Upgrade to FinDash Pro</h3>
                <p className="text-sm text-gray-300 font-medium mb-8 relative z-10 max-w-lg">Unlock the full power of your financial data with intelligent automation and enterprise-grade reporting capabilities.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mb-8">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="w-10 h-10 rounded-xl bg-[#8e73ff]/20 flex items-center justify-center mb-3 border border-[#8e73ff]/30"><Icon name="activity" className="w-5 h-5 text-[#a594df]"/></div>
                        <h4 className="text-white font-bold mb-1 tracking-wide text-sm flex items-center justify-between">Neural Vision AI <span className="bg-[#8e73ff] text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Included</span></h4>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">Instantly scan physical receipts bypassing manual entry forever. Optical character recognition handles the math.</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="w-10 h-10 rounded-xl bg-[#00d4aa]/20 flex items-center justify-center mb-3 border border-[#00d4aa]/30"><Icon name="clock" className="w-5 h-5 text-[#00d4aa]"/></div>
                        <h4 className="text-white font-bold mb-1 tracking-wide text-sm">Automated Billing</h4>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">Connect recurring subscriptions (Netflix, Rent) to our pg_cron Postgres engine to automatically deduct logic at Midnight UTC.</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="w-10 h-10 rounded-xl bg-[#ffb347]/20 flex items-center justify-center mb-3 border border-[#ffb347]/30"><Icon name="file-text" className="w-5 h-5 text-[#ffb347]"/></div>
                        <h4 className="text-white font-bold mb-1 tracking-wide text-sm">A4 PDF Statements</h4>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">Download strictly accurate, beautiful multi-page PDF renders of your dashboard for tax or legal portfolio reporting.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                    <button className="w-full sm:w-auto px-8 py-3.5 bg-white text-[#1a1825] font-bold rounded-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-0.5 shadow-lg">Activate Pro • $8.99/mo</button>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest"><Icon name="shield" className="w-3 h-3 inline mr-1 -mt-0.5"/> Billed exclusively via Stripe</span>
                </div>
            </div>

            <div className="card border border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-900/10 backdrop-blur-md">
                <h3 className="font-serif text-xl mb-4 text-red-600 dark:text-red-400 font-bold flex items-center gap-2"><Icon name="trash" className="w-5 h-5"/> Danger Zone</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">This will permanently delete all your manually entered transactions and savings goals across the entire cloud structural node.</p>
                <button onClick={handleReset} className="py-3 px-6 bg-red-100/50 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded-xl font-bold hover:bg-red-200/50 dark:hover:bg-red-900/60 transition shadow-sm border border-red-200/50 dark:border-red-800/50">
                    Hard Reset User Ledger
                </button>
            </div>
        </div>
    );
};
