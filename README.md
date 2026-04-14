@'
# Legacy Album 📸

A premium digital-to-physical memory preservation platform. Transform your phone photos into heirloom-quality printed albums.

## ✨ Features

- 🔐 Secure authentication (Email + Google OAuth)
- 📤 Drag-and-drop photo upload with compression
- 🎨 4+ vintage-inspired album templates
- 📝 Add captions & stories to photos
- 💳 M-Pesa & PayPal payment integration (Kenya + Global)
- 📦 Real-time order tracking
- 🛡️ Rate limiting + security headers + RLS policies

## 🚀 Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (Auth + Database + Storage)
- **Payments:** Pesapal (M-Pesa) + Stripe
- **Hosting:** Vercel
- **Security:** Zod validation, rate limiting, CSP headers, Row Level Security

## 📋 Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account
- Vercel account (for deployment)

## 🛠️ Local Development

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/legacy-album-app.git
cd legacy-album-app

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run the dev server
npm run dev

# 5. Open http://localhost:3000