// src/components/OrderConfirmationPDF.tsx
/* eslint-disable jsx-a11y/alt-text */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'

const B = {
  gold:    '#c9a050',
  bg:      '#faf7f2',
  dark:    '#1a1410',
  muted:   '#5c4d3a',
  faint:   '#9c8a74',
  border:  '#d4c4ad',
  success: '#4a7c59',
  pending: '#8a6a2e',
  white:   '#ffffff',
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: B.white,
    padding: 36,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: `1.5px solid ${B.gold}`,
  },
  logoBlock: { flexDirection: 'column' },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: B.dark,
    fontFamily: 'Helvetica-Bold',
  },
  logoTagline: {
    fontSize: 8,
    color: B.gold,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  headerRight: { flexDirection: 'column', alignItems: 'flex-end' },
  headerLabel: { fontSize: 9, color: B.faint, letterSpacing: 1 },
  headerOrderId: { fontSize: 11, color: B.muted, marginTop: 2 },
  section: {
    marginBottom: 14,
    padding: 14,
    backgroundColor: B.bg,
    borderRadius: 6,
    border: `0.5px solid ${B.border}`,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: B.dark,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: `0.5px solid ${B.border}`,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 9, color: B.faint },
  value: { fontSize: 9, color: B.dark },
  // ✅ FIX: Two concrete style objects — never a `false | Style` union
  badgePaid: {
    backgroundColor: B.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  badgePending: {
    backgroundColor: B.pending,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 8,
    color: B.white,
    fontFamily: 'Helvetica-Bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTop: `1px solid ${B.border}`,
  },
  totalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: B.dark },
  totalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: B.gold },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 4 },
  photoItem: { width: '32%', marginBottom: 4 },
  photo: {
    width: '100%',
    height: 75,
    objectFit: 'cover',
    borderRadius: 4,
    border: `0.5px solid ${B.border}`,
  },
  photoOverflow: { fontSize: 8, color: B.faint, marginTop: 4, fontStyle: 'italic' },
  step: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' },
  stepBullet: {
    width: 16,
    height: 16,
    backgroundColor: B.gold,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepBulletText: { fontSize: 8, color: B.white, fontFamily: 'Helvetica-Bold' },
  stepText: { fontSize: 9, color: B.muted, lineHeight: 1.5, flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTop: `0.5px solid ${B.border}`,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 8, color: B.faint },
  footerGold: { fontSize: 8, color: B.gold },
})

export type OrderConfirmationPDFProps = {
  orderId:       string
  customerName:  string
  planName:      string
  totalAmount:   number
  paymentMethod: string
  paymentStatus: string
  photos:        Array<{ public_url: string; file_name: string }>
  orderDate:     string
}

const STEPS = [
  "We'll review your order and confirm details within 24 hours.",
  'Your album will be printed and leather-bound within 3–5 business days.',
  'Free delivery across Kenya — tracking sent via SMS.',
  'Questions? WhatsApp or email support@legacy-album.co.ke',
]

const PAID_STATUSES = new Set(['paid', 'completed', 'success'])

export default function OrderConfirmationPDF({
  orderId,
  customerName,
  planName,
  totalAmount,
  paymentMethod,
  paymentStatus,
  photos,
  orderDate,
}: OrderConfirmationPDFProps) {
  const isPaid = PAID_STATUSES.has(paymentStatus.toLowerCase())

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.header}>
          <View style={styles.logoBlock}>
            <Text style={styles.logo}>The Legacy Album</Text>
            <Text style={styles.logoTagline}>PRESERVING YOUR STORY</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>ORDER CONFIRMATION</Text>
            <Text style={styles.headerOrderId}>
              #{orderId.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          {(
            [
              ['Customer',       customerName],
              ['Album Plan',     planName],
              ['Order Date',     orderDate],
              ['Payment Method', paymentMethod],
            ] as [string, string][]
          ).map(([lbl, val]) => (
            <View key={lbl} style={styles.row}>
              <Text style={styles.label}>{lbl}</Text>
              <Text style={styles.value}>{val}</Text>
            </View>
          ))}

          <View style={styles.row}>
            <Text style={styles.label}>Payment Status</Text>
            {/* ✅ FIX: ternary between two fully-typed StyleSheet entries */}
            <View style={isPaid ? styles.badgePaid : styles.badgePending}>
              <Text style={styles.badgeText}>
                {paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Album ({planName})</Text>
            <Text style={styles.value}>
              KES {totalAmount.toLocaleString('en-KE')}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery</Text>
            <Text style={[styles.value, { color: B.success }]}>Free</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>
              KES {totalAmount.toLocaleString('en-KE')}
            </Text>
          </View>
        </View>

        {photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Photo Preview — {photos.length} photo
              {photos.length !== 1 ? 's' : ''} selected
            </Text>
            <View style={styles.photosGrid}>
              {photos.slice(0, 6).map((photo, i) => (
                <View key={i} style={styles.photoItem}>
                  <Image style={styles.photo} src={photo.public_url} />
                </View>
              ))}
            </View>
            {photos.length > 6 && (
              <Text style={styles.photoOverflow}>
                +{photos.length - 6} more photos will appear in your finished album
              </Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Happens Next</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepBullet}>
                <Text style={styles.stepBulletText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            The Legacy Album · Preserving Kenyan Memories
          </Text>
          <Text style={styles.footerGold}>legacy-album.co.ke</Text>
        </View>

      </Page>
    </Document>
  )
}