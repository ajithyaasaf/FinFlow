'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Search, Eye } from 'lucide-react'
import { ClientEditModal } from './client-edit-modal'
import { format } from 'date-fns'
import Link from 'next/link'

interface ClientListProps {
    initialClients: any[]
}

export function ClientList({ initialClients }: ClientListProps) {
    const [search, setSearch] = useState('')
    const [clients, setClients] = useState(initialClients)

    useEffect(() => {
        setClients(initialClients)
    }, [initialClients])

    const filteredClients = clients.filter(client =>
        client.full_name.toLowerCase().includes(search.toLowerCase()) ||
        client.mobile_number.includes(search) ||
        client.pan_number?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                    placeholder="Search by name, mobile, or PAN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                />
            </div>

            <div className="border rounded-lg bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Identifiers</TableHead>
                            <TableHead>Onboarded By</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.map((client) => (
                            <TableRow key={client.client_id} className="group">
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/dashboard/clients/${client.client_id}`}
                                        className="flex items-center gap-2 hover:text-primary transition-colors"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                            {client.full_name.charAt(0)}
                                        </div>
                                        {client.full_name}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <p>{client.mobile_number}</p>
                                        <p className="text-gray-500 text-xs">{client.email}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <p>PAN: {client.pan_number || '-'}</p>
                                        <p className="text-gray-500 text-xs">Aadhaar: {client.aadhaar_number || '-'}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {client.onboarding_agent?.full_name || 'Unknown'}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(client.created_at), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/dashboard/clients/${client.client_id}`}>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <ClientEditModal client={client} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredClients.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                                    No clients found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

