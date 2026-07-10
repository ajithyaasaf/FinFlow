'use client'

import { useState } from 'react'
import { StaffCreateModal } from './staff-create-modal'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'

export function StaffPageHeader() {
    const [createOpen, setCreateOpen] = useState(false)

    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-gray-600 mt-2">Monitor staff performance and activity</p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User / Staff
                </Button>
            </div>

            <StaffCreateModal open={createOpen} onOpenChange={setCreateOpen} />
        </>
    )
}
