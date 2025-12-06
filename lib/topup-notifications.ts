/**
 * Top-Up Loan Notification System
 * 
 * Handles all notifications for top-up offers:
 * - Email notifications via Resend
 * - In-app notifications for admin
 * - WhatsApp link generation (manual sending)
 */

import type { TopUpOffer, Client } from '@/types'

/**
 * Generate WhatsApp link for manual sending
 * Uses wa.me format that opens WhatsApp with pre-filled message
 */
export function generateWhatsAppLink(
    mobile: string,
    amount: number,
    clientName: string
): string {
    // Format mobile number (remove +91 if present, ensure 10 digits)
    const cleanMobile = mobile.replace(/^\+91/, '').replace(/\D/g, '')
    const formattedMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile

    const message = `Hi ${clientName}! 🎉

Great news from FinFlow!

Based on your excellent payment history, you're now eligible for an additional top-up loan of ₹${amount.toLocaleString('en-IN')}.

✅ Benefits:
• No new KYC required
• Same competitive interest rate  
• Quick approval process
• Instant disbursal

This offer is valid for 30 days.

To apply or know more, please contact us or visit the app.

Thank you for being a valued customer!
- FinFlow Team`

    return `https://wa.me/${formattedMobile}?text=${encodeURIComponent(message)}`
}

/**
 * Email template for top-up offer (HTML)
 */
export function generateTopUpEmailHTML(
    client: Client,
    offer: TopUpOffer
): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Top-Up Loan Offer</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
              <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">You're Pre-Approved for a Top-Up Loan</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px; color: #333333;">
              <p style="font-size: 16px; margin: 0;">Dear <strong>${client.full_name}</strong>,</p>
            </td>
          </tr>

          <!-- Amount Card -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <div style="background: #f0f9ff; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px;">
                <p style="margin: 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Top-Up Amount</p>
                <h2 style="margin: 10px 0 0; color: #667eea; font-size: 36px;">₹${offer.offered_amount.toLocaleString('en-IN')}</h2>
              </div>
            </td>
          </tr>

          <!-- Why Eligible -->
          <tr>
            <td style="padding: 0 30px 20px; color: #333;">
              <h3 style="color: #667eea; font-size: 18px; margin: 0 0 15px;">Why You're Eligible:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li style="margin-bottom: 8px;">✅ Excellent payment record (${offer.eligibility_details.emisPaid} EMIs paid on time)</li>
                <li style="margin-bottom: 8px;">✅ ${offer.eligibility_details.repaidPercentage.toFixed(1)}% principal repaid</li>
                <li style="margin-bottom: 8px;">✅ No due payments</li>
                <li style="margin-bottom: 8px;">✅ Strong repayment history</li>
              </ul>
            </td>
          </tr>

          <!-- Benefits -->
          <tr>
            <td style="padding: 0 30px 20px; color: #333;">
              <h3 style="color: #667eea; font-size: 18px; margin: 0 0 15px;">Benefits:</h3>
              <table width="100%" cellpadding="10" cellspacing="0">
                <tr>
                  <td width="50%" style="vertical-align: top;">
                    <div style="background: #fafafa; padding: 15px; border-radius: 6px;">
                      <p style="margin: 0; font-weight: bold; color: #667eea;">🚀 Quick Approval</p>
                      <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Fast-track processing</p>
                    </div>
                  </td>
                  <td width="50%" style="vertical-align: top;">
                    <div style="background: #fafafa; padding: 15px; border-radius: 6px;">
                      <p style="margin: 0; font-weight: bold; color: #667eea;">📄 No New KYC</p>
                      <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Use existing documents</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="vertical-align: top; padding-top: 10px;">
                    <div style="background: #fafafa; padding: 15px; border-radius: 6px;">
                      <p style="margin: 0; font-weight: bold; color: #667eea;">💰 Same Rate</p>
                      <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Competitive interest</p>
                    </div>
                  </td>
                  <td width="50%" style="vertical-align: top; padding-top: 10px;">
                    <div style="background: #fafafa; padding: 15px; border-radius: 6px;">
                      <p style="margin: 0; font-weight: bold; color: #667eea;">⚡ Instant Disbursal</p>
                      <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Quick fund transfer</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Validity -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 6px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">⏰ This offer is valid for <strong>30 days</strong></p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <a href="tel:+919876543210" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: bold;">Contact Us Now</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center; color: #666;">
              <p style="margin: 0; font-size: 12px;">Questions? Reply to this email or call us at +91 98765 43210</p>
              <p style="margin: 10px 0 0; font-size: 11px; color: #999;">
                Developed by <a href="https://www.godivatech.com" style="color: #667eea; text-decoration: none;">Godiva Tech</a>, Madurai
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Plain text version for email clients that don't support HTML
 */
export function generateTopUpEmailText(
    client: Client,
    offer: TopUpOffer
): string {
    return `
Congratulations ${client.full_name}!

You're Pre-Approved for a Top-Up Loan

YOUR TOP-UP AMOUNT: ₹${offer.offered_amount.toLocaleString('en-IN')}

WHY YOU'RE ELIGIBLE:
✓ Excellent payment record (${offer.eligibility_details.emisPaid} EMIs paid on time)
✓ ${offer.eligibility_details.repaidPercentage.toFixed(1)}% principal repaid
✓ No due payments
✓ Strong repayment history

BENEFITS:
• No new KYC documents needed
• Same competitive interest rate
• Quick approval process
• Instant disbursal

This offer is valid for 30 days.

To apply or know more, please contact us at +91 98765 43210 or reply to this email.

Thank you for being a valued customer!
- FinFlow Team

---
Developed by Godiva Tech, Madurai
www.godivatech.com
  `.trim()
}
