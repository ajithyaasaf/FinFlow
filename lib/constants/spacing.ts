// Design System - Spacing Tokens
export const SPACING = {
    // Bottom Navigation
    BOTTOM_NAV_HEIGHT: '64px', // 4rem
    BOTTOM_NAV_HEIGHT_NUM: 64,
    BOTTOM_NAV_SAFE_AREA: '80px', // 64px + 16px buffer

    // Headers
    HEADER_HEIGHT: '56px',
    HEADER_HEIGHT_NUM: 56,

    // Touch Targets
    MIN_TOUCH_TARGET: '48px',
    MIN_TOUCH_TARGET_NUM: 48,

    // Z-Index Scale
    Z_INDEX: {
        base: 0,
        dropdown: 10,
        sticky: 20,
        header: 40,
        bottomNav: 50,
        modal: 60,
        toast: 70,
    },

    // Consistent spacing scale
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
} as const

// Safe area support for notched devices
export const SAFE_AREA = {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
} as const
