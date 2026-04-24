// src/emails/OrderConfirmation.tsx
//
// This was referenced by email.ts but never created — that's why
// every email send was crashing with a module-not-found error.
//
// Uses @react-email/components for inbox-safe rendering.
// Install if needed: npm install @react-email/components

import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
} from '@react-email/components'

// ── Brand tokens (email-safe hex only, no CSS vars) ──────────────────
const B = {
  gold:    '#c9a050',
  dark:    '#1a1410',
  muted:   '#5c4d3a',
  faint:   '#9c8a74',
  bg:      '#faf7f2',
  surface: '#f2ebe0',
  border:  '#d4c4ad',
  success: '#4a7c59',
  white:   '#ffffff',
}

// ── Types ─────────────────────────────────────────────────────────────
export type OrderConfirmationEmailProps = {
  orderId:      string
  customerName: string
  planName:     string
  amount:       string  // Pre-formatted string e.g. "KES 25,000"
  orderDate?:   string
  trackingUrl?: string
}

const STEPS = [
  { num: '1', text: "We'll review your order and confirm details within 24 hours." },
  { num: '2', text: 'Your album will be printed and leather-bound within 3–5 business days.' },
  { num: '3', text: 'Free delivery across Kenya — tracking link sent via SMS.' },
]

// ── Component ─────────────────────────────────────────────────────────
export default function OrderConfirmation({
  orderId,
  customerName,
  planName,
  amount,
  orderDate,
  trackingUrl,
}: OrderConfirmationEmailProps) {
  const shortId  = orderId.slice(0, 8).toUpperCase()
  const date     = orderDate ?? new Date().toLocaleDateString('en-KE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Your Legacy Album order #{shortId} is confirmed — we&#39;re preparing your memories.
      </Preview>

      <Tailwind>
        <Body style={{ backgroundColor: B.bg, fontFamily: 'Georgia, serif', margin: 0 }}>
          <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px' }}>

            {/* ── Header ── */}
            <Section style={{
              backgroundColor: B.dark,
              borderRadius: '12px 12px 0 0',
              padding: '28px 32px',
              textAlign: 'center',
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: B.white,
                margin: 0,
                letterSpacing: '-0.5px',
              }}>
                The Legacy Album
              </Text>
              <Text style={{
                fontSize: 10,
                color: B.gold,
                margin: '4px 0 0',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}>
                Preserving Your Story
              </Text>
            </Section>

            {/* ── Gold divider ── */}
            <div style={{
              height: 3,
              background: `linear-gradient(90deg, ${B.dark}, ${B.gold}, ${B.dark})`,
            }} />

            {/* ── Body card ── */}
            <Section style={{
              backgroundColor: B.white,
              padding: '32px',
              border: `1px solid ${B.border}`,
              borderTop: 'none',
            }}>

              {/* Greeting */}
              <Heading style={{
                fontSize: 20,
                color: B.dark,
                margin: '0 0 8px',
              }}>
                Your album is confirmed, {customerName.split(' ')[0]}. ✨
              </Heading>
              <Text style={{ color: B.muted, fontSize: 15, margin: '0 0 24px', lineHeight: 1.6 }}>
                Thank you for choosing The Legacy Album. We&#39;re getting started on
                preserving your memories — here are your order details.
              </Text>

              <Hr style={{ borderColor: B.border, margin: '0 0 24px' }} />

              {/* Order summary table */}
              <Section style={{
                backgroundColor: B.surface,
                borderRadius: 8,
                padding: '16px 20px',
                marginBottom: 24,
                border: `1px solid ${B.border}`,
              }}>
                {[
                  ['Order ID',   `#${shortId}`],
                  ['Album Plan', planName],
                  ['Amount',     amount],
                  ['Date',       date],
                ].map(([lbl, val]) => (
                  <Row key={lbl} style={{ marginBottom: 10 }}>
                    <Column style={{ width: '45%' }}>
                      <Text style={{ fontSize: 12, color: B.faint, margin: 0 }}>{lbl}</Text>
                    </Column>
                    <Column>
                      <Text style={{ fontSize: 13, color: B.dark, margin: 0, fontWeight: 'bold' }}>
                        {val}
                      </Text>
                    </Column>
                  </Row>
                ))}
              </Section>

              {/* CTA button */}
              {trackingUrl && (
                <Section style={{ textAlign: 'center', marginBottom: 28 }}>
                  <Button
                    href={trackingUrl}
                    style={{
                      backgroundColor: B.gold,
                      color: B.dark,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 'bold',
                      padding: '12px 28px',
                      textDecoration: 'none',
                      display: 'inline-block',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Track Your Order
                  </Button>
                </Section>
              )}

              <Hr style={{ borderColor: B.border, margin: '0 0 24px' }} />

              {/* Next steps */}
              <Text style={{
                fontSize: 13,
                fontWeight: 'bold',
                color: B.dark,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: '0 0 16px',
              }}>
                What Happens Next
              </Text>

              {STEPS.map((step) => (
                <Row key={step.num} style={{ marginBottom: 12 }}>
                  <Column style={{ width: 28, verticalAlign: 'top', paddingTop: 1 }}>
                    <div style={{
                      width: 20, height: 20,
                      borderRadius: '50%',
                      backgroundColor: B.gold,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: B.dark,
                      textAlign: 'center',
                      lineHeight: '20px',
                    }}>
                      {step.num}
                    </div>
                  </Column>
                  <Column>
                    <Text style={{ fontSize: 13, color: B.muted, margin: 0, lineHeight: 1.5 }}>
                      {step.text}
                    </Text>
                  </Column>
                </Row>
              ))}

            </Section>

            {/* ── Footer ── */}
            <Section style={{
              backgroundColor: B.surface,
              borderRadius: '0 0 12px 12px',
              padding: '20px 32px',
              border: `1px solid ${B.border}`,
              borderTop: 'none',
              textAlign: 'center',
            }}>
              <Text style={{ fontSize: 12, color: B.faint, margin: '0 0 4px' }}>
                Questions? We&#39;re happy to help.
              </Text>
              <Text style={{ fontSize: 12, color: B.gold, margin: 0 }}>
                support@legacy-album.co.ke • WhatsApp +254740481359
              </Text>
              <Hr style={{ borderColor: B.border, margin: '16px 0 12px' }} />
              <Text style={{ fontSize: 10, color: B.faint, margin: 0 }}>
                The Legacy Album · Nairobi, Kenya · legacy-album.co.ke
              </Text>
              <Text style={{ fontSize: 10, color: B.faint, margin: '4px 0 0' }}>
                You&apos;re receiving this because you placed an order. No marketing — ever.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}