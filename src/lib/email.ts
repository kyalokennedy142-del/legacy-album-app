import { Resend } from 'resend'
import OrderConfirmation from '@/emails/OrderConfirmation'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendOrderConfirmation = async ({
  to,
  orderId,
  amount,
  customerName,
  planName,
}: {
  to: string
  orderId: string
  amount: string
  customerName: string
  planName: string
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Legacy Album <onboarding@resend.dev>', // Replace with your domain later
      to: [to],
      subject: `Order Confirmed: Legacy Album #${orderId.slice(0, 8)}`,
      react: OrderConfirmation({ orderId, amount, customerName, planName }),
    })

    if (error) {
      console.error('Failed to send email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email service error:', error)
    return { success: false, error }
  }
}