export const CATEGORIES = {
    Food: { color: '#6c47ff', icon: 'utensils' },
    Transport: { color: '#ff6b6b', icon: 'car' },
    Shopping: { color: '#ffb347', icon: 'shopping-bag' },
    Health: { color: '#00d4aa', icon: 'activity' },
    Entertainment: { color: '#ff8cc8', icon: 'film' },
    Bills: { color: '#4fc3f7', icon: 'file-text' },
    Other: { color: '#a0a0c0', icon: 'more-horizontal' },
};

export const formatINR = (val) => '₹' + Math.round(Number(val)).toLocaleString('en-IN');
export const getMonthId = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
export const getMonthName = (mId) => new Date(mId.split('-')[0], mId.split('-')[1]-1, 1).toLocaleString('default', { month: 'short', year:'2-digit' });
