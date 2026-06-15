import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { formatCurrency, formatDate, calculateEMI } from '@/lib/utils'
import type { Quotation, Client } from '@/types'

// Helper to format currency for PDF by replacing ₹ with Rs. to prevent character rendering bugs
const formatPDFCurrency = (amount: number): string => {
    return formatCurrency(amount).replace('₹', 'Rs. ')
}

// Register fonts (optional - using default for now)
// Font.register({
//   family: 'Roboto',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf'
// })

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 11,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 30,
        borderBottom: '2px solid #3b82f6',
        paddingBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e40af',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
        backgroundColor: '#f1f5f9',
        padding: 8,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    label: {
        width: '40%',
        color: '#64748b',
    },
    value: {
        width: '60%',
        fontWeight: 'bold',
        color: '#0f172a',
    },
    highlight: {
        backgroundColor: '#dbeafe',
        padding: 15,
        borderRadius: 4,
        marginVertical: 15,
    },
    highlightText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e40af',
        textAlign: 'center',
    },
    table: {
        marginTop: 15,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        padding: 8,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottom: '1px solid #e2e8f0',
    },
    col1: { width: '50%' },
    col2: { width: '50%', textAlign: 'right' },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 9,
        borderTop: '1px solid #e2e8f0',
        paddingTop: 10,
    },
    warning: {
        backgroundColor: '#fef3c7',
        padding: 12,
        borderLeft: '4px solid #f59e0b',
        marginVertical: 15,
    },
    warningText: {
        fontSize: 10,
        color: '#92400e',
    },
})

interface QuotationPDFProps {
    quotation: {
        amount: number
        interest_rate: number
        tenure: number
        final_amount: number
        is_high_value: boolean
        created_at: string
    }
    client: {
        full_name: string
        mobile_number: string
    }
    quoteNumber: string
}

export function QuotationPDF({ quotation, client, quoteNumber }: QuotationPDFProps) {
    const emi = calculateEMI(quotation.amount, quotation.interest_rate, quotation.tenure)
    const totalInterest = quotation.final_amount - quotation.amount
    const processingFee = quotation.amount * 0.01 // 1% processing fee (example)

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>FinFlow</Text>
                    <Text style={styles.subtitle}>Loan Quotation</Text>
                </View>

                {/* Quote Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quotation Details</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Quote Number:</Text>
                        <Text style={styles.value}>{quoteNumber}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Date:</Text>
                        <Text style={styles.value}>{formatDate(quotation.created_at)}</Text>
                    </View>
                </View>

                {/* Client Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Client Information</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Name:</Text>
                        <Text style={styles.value}>{client.full_name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Mobile:</Text>
                        <Text style={styles.value}>{client.mobile_number}</Text>
                    </View>
                </View>

                {/* Loan Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Loan Details</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Loan Amount:</Text>
                        <Text style={styles.value}>{formatPDFCurrency(quotation.amount)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Interest Rate:</Text>
                        <Text style={styles.value}>{quotation.interest_rate}% per annum</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Tenure:</Text>
                        <Text style={styles.value}>{quotation.tenure} months</Text>
                    </View>
                </View>

                {/* EMI Highlight */}
                <View style={styles.highlight}>
                    <Text style={styles.highlightText}>
                        Monthly EMI: {formatPDFCurrency(emi)}
                    </Text>
                </View>

                {/* Payment Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Breakdown</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.col1}>Particulars</Text>
                            <Text style={styles.col2}>Amount</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.col1}>Principal Amount</Text>
                            <Text style={styles.col2}>{formatPDFCurrency(quotation.amount)}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.col1}>Total Interest</Text>
                            <Text style={styles.col2}>{formatPDFCurrency(totalInterest)}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.col1}>Processing Fee (1%)</Text>
                            <Text style={styles.col2}>{formatPDFCurrency(processingFee)}</Text>
                        </View>
                        <View style={[styles.tableRow, { backgroundColor: '#f1f5f9', fontWeight: 'bold' }]}>
                            <Text style={styles.col1}>Total Payable</Text>
                            <Text style={styles.col2}>{formatPDFCurrency(quotation.final_amount + processingFee)}</Text>
                        </View>
                    </View>
                </View>

                {/* High Value Warning */}
                {quotation.is_high_value && (
                    <View style={styles.warning}>
                        <Text style={styles.warningText}>
                            ⚠ This is a high-value quotation and is subject to additional verification and approval from management.
                        </Text>
                    </View>
                )}

                {/* Terms & Conditions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                    <Text style={{ fontSize: 9, color: '#64748b', lineHeight: 1.4 }}>
                        1. This is an indicative quotation and subject to final approval.{'\n'}
                        2. Interest rate is based on reducing balance method.{'\n'}
                        3. Processing fee is non-refundable.{'\n'}
                        4. Final loan sanction is subject to credit appraisal and KYC verification.{'\n'}
                        5. Prepayment charges may apply as per company policy.{'\n'}
                        6. This quotation is valid for 15 days from the date of issue.
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>
                        This is a computer-generated quotation and does not require a signature.
                    </Text>
                    <Text style={{ marginTop: 5 }}>
                        FinFlow - Empowering Financial Freedom
                    </Text>
                </View>
            </Page>
        </Document>
    )
}
