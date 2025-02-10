export const theme = {
  colors: {
    primary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
    },
  },
  components: {
    card: 'bg-white rounded-xl shadow-sm p-6',
    button: {
      base: 'px-4 h-10 rounded-xl font-medium transition-all duration-200 flex items-center justify-center',
      primary: 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm border border-gray-200',
      danger: 'group relative bg-white border border-red-200 text-red-600 hover:border-red-300',
    },
    input: 'w-full px-3 h-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none',
    badge: {
      base: 'px-2.5 py-0.5 rounded-full text-xs font-medium',
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      finished: 'bg-yellow-100 text-yellow-800',
    }
  }
}; 