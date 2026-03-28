import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { TransactionSchema, GoalSchema } from '../lib/validations';

export function useDatabase(session) {
    const queryClient = useQueryClient();
    const uid = session?.user?.id;

    const { data: transactions = [], isLoading: txLoading } = useQuery({
        queryKey: ['transactions', uid],
        queryFn: async () => {
            if (!uid) return [];
            const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!uid
    });

    const { data: goals = [], isLoading: goalsLoading } = useQuery({
        queryKey: ['goals', uid],
        queryFn: async () => {
            if (!uid) return [];
            const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        enabled: !!uid
    });

    const { data: settings = { totalBudget: 29000, monthlyIncome: 45000, theme_color: '#6c47ff', avatar_url: '' }, isLoading: settingsLoading } = useQuery({
        queryKey: ['settings', uid],
        queryFn: async () => {
            if (!uid) return null;
            const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();
            if (error) throw error;
            if (data) {
                return {
                    totalBudget: data.total_budget,
                    monthlyIncome: data.monthly_income,
                    theme_color: data.theme_color,
                    avatar_url: data.avatar_url
                };
            }
            return { totalBudget: 29000, monthlyIncome: 45000, theme_color: '#6c47ff', avatar_url: '' };
        },
        enabled: !!uid
    });

    const loading = txLoading || goalsLoading || settingsLoading;

    // Mutations (manually wrapping them so we retain the identical hook return signature)
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['transactions', uid] });
        queryClient.invalidateQueries({ queryKey: ['goals', uid] });
        queryClient.invalidateQueries({ queryKey: ['settings', uid] });
    };

    const addTransaction = async (txn) => {
        if(!uid) return { error: { message: "Not authenticated" } };
        try {
            TransactionSchema.parse(txn);
            const { data, error } = await supabase.from('transactions').insert([{ ...txn, user_id: uid }]).select().single();
            if (!error) invalidate();
            return { data, error };
        } catch (err) {
            console.error(err);
            return { error: err };
        }
    };

    const addTransactionsBatch = async (txns) => {
        if(!uid) return { error: { message: "Not authenticated" } };
        try {
            txns.forEach(t => TransactionSchema.parse(t));
            const batch = txns.map(t => ({ ...t, user_id: uid }));
            const { data, error } = await supabase.from('transactions').insert(batch).select();
            if (!error) invalidate();
            return { data, error };
        } catch (err) {
            console.error(err);
            return { error: err };
        }
    };

    const deleteTransaction = async (id) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (!error) invalidate();
        return { error };
    };

    const addGoal = async (goal) => {
        if(!uid) return { error: { message: "Not authenticated" } };
        try {
            GoalSchema.parse(goal);
            const { data, error } = await supabase.from('goals').insert([{ ...goal, user_id: uid }]).select().single();
            if (!error) invalidate();
            return { data, error };
        } catch (err) {
            console.error(err);
            return { error: err };
        }
    };

    const deleteGoal = async (id) => {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (!error) invalidate();
        return { error };
    };

    const updateGoalSaved = async (id, newSaved) => {
        const { data, error } = await supabase.from('goals').update({ saved: newSaved }).eq('id', id).select().single();
        if (!error) invalidate();
        return { data, error };
    };

    const updateSettings = async (updates) => {
        if(!uid) return { error: { message: "Not authenticated" } };
        try {
            const payload = { ...updates, user_id: uid };
            const existing = await supabase.from('settings').select('id').eq('user_id', uid).limit(1).maybeSingle();
            let res;
            if (existing.data) {
                res = await supabase.from('settings').update(payload).eq('id', existing.data.id).select().single();
            } else {
                res = await supabase.from('settings').insert([payload]).select().single();
            }
            if (!res.error) invalidate();
            return { data: res.data, error: res.error };
        } catch (err) {
            return { error: err };
        }
    };

    const resetDatabase = async () => {
        if(!uid) return;
        await Promise.all([
            supabase.from('transactions').delete().eq('user_id', uid),
            supabase.from('goals').delete().eq('user_id', uid),
            supabase.from('settings').delete().eq('user_id', uid)
        ]);
        invalidate();
    };

    return { 
        transactions, goals, settings, loading, 
        addTransaction, addTransactionsBatch, deleteTransaction, 
        addGoal, deleteGoal, updateGoalSaved, 
        updateSettings, resetDatabase 
    };
}
