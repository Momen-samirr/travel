# Tourism Company Website

A professional, production-ready tourism website built with Next.js, featuring comprehensive booking management, payment integrations, and admin dashboard.

## Features

### Core Functionality
- **Tours Management**: Browse, search, and book tours with detailed information
- **Flight Booking**: Integration with Amadeus API for real-time flight search
- **Hotels**: Browse and book hotel accommodations
- **Visa Services**: Apply for visa services with document requirements
- **Blog System**: Content management with rich text editor
- **Reviews & Ratings**: Customer reviews with moderation system
- **Complaints Management**: Track and resolve customer complaints

### Technical Features
- **Authentication**: Clerk-based authentication with role-based access control
- **Payments**: Paymob and Egyptian banks payment gateway integration
- **Email Notifications**: Resend email service for transactional emails
- **Image Management**: Cloudinary integration for optimized image handling
- **SEO Optimized**: Meta tags, structured data (JSON-LD), sitemap generation
- **Security**: Rate limiting, input validation, webhook signature verification, security headers

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Styling**: Tailwind CSS + shadcn/ui
- **Payments**: Paymob, Egyptian Banks
- **Email**: Resend
- **Images**: Cloudinary
- **Flights API**: Amadeus

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Clerk account
- Cloudinary account
- Resend account
- Paymob account (for payments)
- Amadeus API credentials (for flights)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tours
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables:
- Database connection string
- Clerk keys
- Payment gateway credentials
- Email service credentials
- Cloudinary credentials
- Amadeus API credentials

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
tours/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes
│   │   ├── (public)/          # Public pages
│   │   ├── admin/             # Admin dashboard
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── admin/             # Admin components
│   │   ├── tours/             # Tour components
│   │   └── shared/             # Shared components
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── clerk.ts           # Clerk utilities
│   │   ├── paymob.ts          # Paymob integration
│   │   ├── bank-payment.ts    # Bank payment integration
│   │   ├── amadeus.ts         # Amadeus API client
│   │   ├── email.ts           # Email service
│   │   ├── cloudinary.ts      # Image upload
│   │   └── validations/       # Zod schemas
│   └── middleware.ts          # Next.js middleware
└── public/                     # Static assets
```

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

The application uses Prisma with PostgreSQL. Key models include:
- User (with Clerk integration)
- Tour, Flight, Hotel, Visa
- Booking
- Review
- Complaint
- Blog
- EmailNotification

## Admin Dashboard

Access the admin dashboard at `/admin` (requires ADMIN or SUPER_ADMIN role).

Features:
- Dashboard with statistics
- Tour management (CRUD)
- Flight management
- Hotel management
- Visa management
- Blog management
- Review moderation
- Complaint management

## API Routes

- `/api/tours` - Tour management
- `/api/bookings` - Booking management
- `/api/payments/paymob` - Paymob payment
- `/api/payments/bank` - Bank payment
- `/api/webhooks/paymob` - Paymob webhooks
- `/api/webhooks/bank` - Bank webhooks
- `/api/amadeus/search` - Flight search
- `/api/reviews` - Review management
- `/api/complaints` - Complaint management
- `/api/blogs` - Blog management

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database

Use a managed PostgreSQL service:
- Vercel Postgres
- Supabase
- Neon
- AWS RDS

### Environment Variables

Ensure all environment variables are set in your deployment platform.

## Security

- Rate limiting on API routes
- Input validation with Zod
- Webhook signature verification
- Security headers (CSP, XSS protection, etc.)
- Role-based access control
- SQL injection prevention (Prisma)

## Performance

- Image optimization with Cloudinary
- Static generation for public pages
- ISR for dynamic content
- Code splitting and lazy loading
- SEO optimization

## License

[Your License Here]

## Support

For issues and questions, please open an issue in the repository.
