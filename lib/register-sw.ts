'use client'

import { useEffect } from 'react'

export function registerServiceWorker() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('Service Worker registered:', registration)

                        // Check for updates periodically
                        setInterval(() => {
                            registration.update()
                        }, 60000) // Check every minute
                    })
                    .catch((error) => {
                        console.log('Service Worker registration failed:', error)
                    })
            })
        }
    }, [])
}
