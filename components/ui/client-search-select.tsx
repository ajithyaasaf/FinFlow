'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import type { Client } from '@/types'

interface ClientSearchSelectProps {
    clients: Client[]
    selectedClientId: string
    onSelect: (clientId: string) => void
    placeholder?: string
}

export function ClientSearchSelect({
    clients,
    selectedClientId,
    onSelect,
    placeholder = 'Choose a client'
}: ClientSearchSelectProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const filteredClients = searchQuery.trim() === ''
        ? clients
        : clients.filter(c =>
            c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.mobile_number.includes(searchQuery)
        )

    const selectedClient = clients.find(c => c.client_id === selectedClientId)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-11 px-4 border-gray-200 bg-white font-normal hover:bg-gray-50 text-gray-900 rounded-xl shadow-none"
                >
                    {selectedClient ? (
                        <span className="truncate text-left">
                            {selectedClient.full_name} - {selectedClient.mobile_number}
                        </span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border border-gray-150 shadow-airbnb-lg bg-white overflow-hidden z-[100]">
                <div className="flex items-center border-b border-gray-100 px-3 py-2 gap-2 bg-gray-50/50">
                    <Search className="h-4 w-4 shrink-0 text-gray-400" />
                    <Input
                        placeholder="Search client by name or mobile..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm shadow-none"
                    />
                </div>
                <ScrollArea className="max-h-60">
                    <div className="p-1">
                        {filteredClients.length === 0 ? (
                            <div className="text-sm text-gray-500 text-center py-6">
                                No clients found
                            </div>
                        ) : (
                            filteredClients.map((client) => {
                                const isSelected = client.client_id === selectedClientId
                                return (
                                    <button
                                        key={client.client_id}
                                        type="button"
                                        onClick={() => {
                                            onSelect(client.client_id)
                                            setOpen(false)
                                            setSearchQuery('')
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left rounded-lg transition-colors ${
                                            isSelected
                                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                                : 'text-gray-700 hover:bg-gray-100/80'
                                        }`}
                                    >
                                        <span className="truncate pr-4">
                                            {client.full_name} <span className="text-gray-400 font-normal">•</span> {client.mobile_number}
                                        </span>
                                        {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
