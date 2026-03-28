import React from 'react';
import { Utensils, Car, ShoppingBag, Activity, Film, FileText, MoreHorizontal, Sun, Moon, Trash, Upload, Settings, CheckCircle, AlertCircle } from 'lucide-react';

export const Icon = ({ name, className="w-5 h-5", color="currentColor" }) => {
    const icons = {
        'utensils': <Utensils color={color} className={className} />,
        'car': <Car color={color} className={className} />,
        'shopping-bag': <ShoppingBag color={color} className={className} />,
        'activity': <Activity color={color} className={className} />,
        'film': <Film color={color} className={className} />,
        'file-text': <FileText color={color} className={className} />,
        'sun': <Sun color={color} className={className} />,
        'moon': <Moon color={color} className={className} />,
        'trash': <Trash color={color} className={className} />,
        'upload': <Upload color={color} className={className} />,
        'settings': <Settings color={color} className={className} />,
        'check-circle': <CheckCircle color={color} className={className} />,
        'alert-circle': <AlertCircle color={color} className={className} />
    };
    return icons[name] || <MoreHorizontal color={color} className={className} />;
};
