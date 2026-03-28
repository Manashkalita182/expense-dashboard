import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Icon } from './Icon';

export const Auth = () => {
    const [view, setView] = useState('LOGIN'); // 'LOGIN', 'SIGNUP', 'VERIFY'
    const [loading, setLoading] = useState(false);
    
    // Controlled Form Details
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [msg, setMsg] = useState({ text: '', type: '' });

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ text: '', type: '' });
        
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: { data: { full_name: name } } 
        });
            
        if (error) {
            if (error.message.toLowerCase().includes('database error saving new user')) {
                setMsg({ text: 'CRITICAL FIX NEEDED: Your Supabase database has a broken trigger blocking signups! Please open the "FIX_DATABASE_SIGNUPS.sql" file in your folder and run it in your Supabase SQL Editor.', type: 'error' });
            } else {
                setMsg({ text: error.message, type: 'error' });
            }
        } else {
            // If they disabled email confirmations, a session is instantly returned!
            if (data?.session) {
                setMsg({ text: 'Secure signup completed! Authorizing vault...', type: 'success' });
            } else {
                setView('VERIFY');
                setMsg({ text: 'Secure signup completed! We sent a code to your email.', type: 'success' });
            }
        }
        setLoading(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ text: '', type: '' });
        
        const { error } = await supabase.auth.signInWithPassword({ email, password });
            
        if (error) {
            setMsg({ text: error.message, type: 'error' });
        } else {
            setMsg({ text: 'Validating credentials...', type: 'success' });
            // Root watcher assumes control over rendering dashboard.
        }
        setLoading(false);
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ text: '', type: '' });

        const { error } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: 'signup' });
        
        if (error) {
            setMsg({ text: 'Invalid or expired passkey.', type: 'error' });
            setLoading(false);
        } else {
            setMsg({ text: 'Identity rigorously verified! Authorizing vault...', type: 'success' });
        }
    };
    
    const handleGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) setMsg({ text: error.message, type: 'error' });
    };

    return (
     <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0f111a] p-4 transition-colors font-sans w-full relative overflow-hidden">
         {/* Decorative Premium Mesh Background Behind the Card */}
         <div className="absolute top-[-10%] -left-10 w-96 h-96 bg-primary/20 dark:bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
         <div className="absolute top-[-10%] -right-10 w-96 h-96 bg-[#00d4aa]/20 dark:bg-[#00d4aa]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
         
         <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0px_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0px_8px_30px_rgba(0,0,0,0.3)] border border-white/50 dark:border-gray-700/50 z-10 relative">
             
             {/* Header */}
             <div className="text-center mb-8 pt-2">
                 <div className="w-14 h-14 bg-gradient-to-tr from-primary to-[#8e73ff] text-white flex items-center justify-center rounded-2xl mx-auto mb-5 shadow-lg shadow-primary/20">
                     <Icon name={view==='VERIFY' ? 'check-circle' : 'activity'} className="w-7 h-7"/>
                 </div>
                 <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white tracking-tight">
                     {view === 'LOGIN' ? 'Welcome Back' : view === 'SIGNUP' ? 'Create Account' : 'Verify Email'}
                 </h2>
                 <p className="text-sm text-gray-500 mt-2 font-medium">
                     {view === 'LOGIN' ? 'Secure, encrypted access to your financial vault.' : 
                      view === 'SIGNUP' ? 'Start tracking your wealth perfectly securely.' : 
                      `We securely dispatched a verification code to ${email}`}
                 </p>
             </div>

             {/* Verification View */}
             {view === 'VERIFY' && (
                 <form onSubmit={handleVerify} className="space-y-5 animate-slide-up">
                     <div>
                         <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2 block text-center">Enter Access Code</label>
                         <input type="text" required placeholder="PASTE CODE" value={otp} onChange={e=>setOtp(e.target.value.trim())} className="w-full p-4 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 text-2xl tracking-[0.25em] text-center font-bold text-gray-900 dark:text-white transition shadow-inner" />
                     </div>
                     <button disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-primary to-[#8e73ff] text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 text-sm">
                         {loading ? 'Verifying Node Signature...' : 'Gain Access'}
                     </button>
                     <button type="button" onClick={()=>setView('SIGNUP')} className="w-full text-center text-xs font-medium text-gray-400 hover:text-gray-900 dark:hover:text-white transition uppercase tracking-wider mt-4">
                         ‹ Return to Signup
                     </button>
                 </form>
             )}

             {/* Login / Signup View */}
             {(view === 'LOGIN' || view === 'SIGNUP') && (
                 <div className="animate-fade-in space-y-6">
                     <form onSubmit={view==='LOGIN' ? handleLogin : handleSignup} className="space-y-4">
                         {view === 'SIGNUP' && (
                             <div className="animate-slide-up">
                                 <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Legal Name</label>
                                 <input type="text" required placeholder="John Doe" value={name} onChange={e=>setName(e.target.value)} className="w-full p-3.5 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition placeholder:text-gray-300 dark:placeholder:text-gray-600"/>
                             </div>
                         )}
                         <div>
                             <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Email Address</label>
                             <input type="email" required placeholder="name@example.com" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3.5 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition placeholder:text-gray-300 dark:placeholder:text-gray-600"/>
                         </div>
                         <div>
                             <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Master Password</label>
                             <input type="password" required minLength={6} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3.5 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition placeholder:text-gray-300 dark:placeholder:text-gray-600"/>
                         </div>

                         <button disabled={loading} className="w-full py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-sm mt-4">
                             {loading ? 'Processing Protocol...' : (view === 'LOGIN' ? 'Sign In to Vault' : 'Initialize Account')}
                         </button>
                     </form>

                     <div className="relative flex items-center py-1">
                         <div className="flex-grow border-t border-gray-200 dark:border-gray-700/80"></div>
                         <span className="flex-shrink-0 mx-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">OR PROVIDER</span>
                         <div className="flex-grow border-t border-gray-200 dark:border-gray-700/80"></div>
                     </div>

                     <button type="button" onClick={handleGoogle} className="w-full py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700/80 rounded-xl font-bold shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-3 text-sm">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Continue with Google
                     </button>
                     
                     <div className="text-center text-sm font-medium text-gray-500 pt-2">
                         {view === 'LOGIN' ? "Need a vault? " : "Already have key access? "}
                         <button onClick={()=>setView(view==='LOGIN'?'SIGNUP':'LOGIN')} className="text-primary hover:text-primary/80 transition font-bold">
                             {view === 'LOGIN' ? 'Create Account' : 'Sign In'}
                         </button>
                     </div>
                 </div>
             )}

             {msg.text && (
                 <div className={`mt-6 p-4 rounded-xl text-sm font-bold tracking-wide text-center border shadow-sm ${msg.type==='error'?'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400':'bg-[#00d4aa]/5 border-[#00d4aa]/20 text-[#00d4aa] dark:text-[#00d4aa]'}`}>
                     {msg.text}
                 </div>
             )}
         </div>
     </div>
    );
};
