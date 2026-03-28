import React from 'react';
import { Icon } from './Icon';

export const ToastContainer = ({ toasts }) => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transform transition-all animate-slide-up text-sm font-medium ${t.type === 'error' ? 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' : 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'}`}>
                <Icon name={t.type === 'error' ? 'alert-circle' : 'check-circle'} className="w-5 h-5"/>
                {t.message}
            </div>
        ))}
    </div>
);
