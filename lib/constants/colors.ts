// Design System - Color Tokens for Mobile
export const COLORS = {
    // Text colors with WCAG AA compliant contrast
    text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-700',
        tertiary: 'text-gray-600',
        disabled: 'text-gray-400',
        placeholder: 'text-gray-500',
    },

    // Background colors
    bg: {
        primary: 'bg-white',
        secondary: 'bg-gray-50',
        tertiary: 'bg-gray-100',
        accent: 'bg-red-50',
    },

    // State colors
    state: {
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-700',
            icon: 'text-green-600',
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-700',
            icon: 'text-red-600',
        },
        warning: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-800',
            icon: 'text-amber-600',
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-700',
            icon: 'text-blue-600',
        },
    },
} as const
