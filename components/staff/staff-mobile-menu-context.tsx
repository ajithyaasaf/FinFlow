'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface StaffMobileMenuContextType {
    isOpen: boolean
    openMenu: () => void
    closeMenu: () => void
    toggleMenu: () => void
}

const StaffMobileMenuContext = createContext<StaffMobileMenuContextType | undefined>(undefined)

export function StaffMobileMenuProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)

    const openMenu = useCallback(() => setIsOpen(true), [])
    const closeMenu = useCallback(() => setIsOpen(false), [])
    const toggleMenu = useCallback(() => setIsOpen(prev => !prev), [])

    return (
        <StaffMobileMenuContext.Provider value={{ isOpen, openMenu, closeMenu, toggleMenu }}>
            {children}
        </StaffMobileMenuContext.Provider>
    )
}

export function useStaffMobileMenu() {
    const context = useContext(StaffMobileMenuContext)
    if (context === undefined) {
        throw new Error('useStaffMobileMenu must be used within a StaffMobileMenuProvider')
    }
    return context
}
