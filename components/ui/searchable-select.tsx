'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SearchableSelectOption {
    value: string
    label: string
    searchString?: string // Optional extra string to search by (e.g. email)
}

interface SearchableSelectProps {
    options: SearchableSelectOption[]
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = 'Select option...',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No options found.',
    className
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')

    const selectedOption = options.find((opt) => opt.value === value)

    const filteredOptions = React.useMemo(() => {
        if (!search.trim()) return options
        const lowerSearch = search.toLowerCase()
        return options.filter((opt) => {
            const labelMatch = opt.label.toLowerCase().includes(lowerSearch)
            const searchStringMatch = opt.searchString?.toLowerCase().includes(lowerSearch)
            return labelMatch || searchStringMatch
        })
    }, [options, search])

    // Reset search query when popover closes
    React.useEffect(() => {
        if (!open) {
            setSearch('')
        }
    }, [open])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between rounded-xl border-gray-200 bg-white font-normal hover:bg-gray-50 text-gray-900 shadow-none h-11 px-4 transition-all",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border border-gray-150 shadow-airbnb-lg bg-white overflow-hidden z-[100]">
                <div className="flex items-center border-b border-gray-100 px-3 py-2 gap-2 bg-gray-50/50">
                    <Search className="h-4 w-4 shrink-0 text-gray-400" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm shadow-none"
                    />
                </div>
                <ScrollArea className="max-h-60">
                    <div className="p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="text-sm text-gray-500 py-6 text-center">{emptyMessage}</div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = opt.value === value
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onValueChange(opt.value)
                                            setOpen(false)
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg text-left transition-colors",
                                            isSelected 
                                                ? "bg-red-50 text-primary font-semibold" 
                                                : "text-gray-700 hover:bg-gray-100/80"
                                        )}
                                    >
                                        <span className="truncate pr-4">{opt.label}</span>
                                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
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
