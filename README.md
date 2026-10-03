# Leo District 306 D7 - Official Website

> Fostering leadership through service by empowering youth, building communities, and creating impact across Colombo and Ratnapura districts.

## Overview

This is the official website for Leo District 306 D7, a youth leadership organization part of Lions Clubs International serving Sri Lanka. Built with modern web technologies to provide members and the public with information about activities, projects, and leadership development programs.

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS with custom Leo District theming
- **Authentication**: Firebase Auth (Google, Microsoft, Email)
- **Database**: Firestore for user management, projects, and content
- **Deployment**: Optimized for production with security headers
- **UI/UX**: Framer Motion animations, responsive design

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard (role-protected)
│   ├── lms/               # Learning Management System
│   ├── projects/          # Project showcase
│   ├── api/               # API routes (contact, newsletter)
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Homepage
├── components/            # Reusable React components
│   ├── navbar.tsx         # Main navigation
│   ├── footer.tsx         # Site footer
│   ├── theme-provider.tsx # Dark/light theme
│   └── performance-monitor.tsx
├── lib/                   # Utility functions and configs
│   ├── firebase.ts        # Firebase client setup
│   ├── auth.ts            # Authentication logic
│   └── analytics.ts       # Google Analytics
├── types/                 # TypeScript type definitions
├── scripts/               # Database seeding and migrations
├── public/                # Static assets
│   ├── images/           # Event photos
│   ├── logos/            # District/partner logos
│   └── pdfs/             # Official documents
└── styles/               # Global styles and CSS
```

## Key Features

### User Management
- Multi-provider authentication (Google, Microsoft, Email)
- Role-based access control: member, trainer, admin, superadmin
- MyLCI unique ID enforcement for members
- User profiles with Firestore integration

### Core Pages
- **Homepage**: Hero carousel, contact forms, district statistics
- **About**: Organization information and mission
- **Council**: District leadership directory
- **Projects**: Community service project showcase
- **LMS**: Learning Management System with authentication
- **D7 All-Rounders**: Member recognition program
- **Ascent**: Development program

### Admin Dashboard
- Content management for projects and courses
- User role management
- Analytics and reporting
- Protected routes with role guards

### Design & UX
- **Color Scheme**: Burgundy, rose, gold reflecting Leo District branding
- **Typography**: Josefin Sans (headings), Poppins (body)
- **Responsive**: Mobile-first design approach
- **Animations**: Framer Motion with reduced motion support
- **Theme System**: Dark/light mode with persistent preference
- **Accessibility**: Skip links, ARIA labels, keyboard navigation

## Technical Implementation

### Authentication System
Located in `lib/auth.ts`:
- Email/password registration with MyLCI validation
- Google and Microsoft OAuth providers
- Transaction-based MyLCI uniqueness enforcement
- Automatic user profile creation on first login

### Component Architecture
- **Responsive Navigation**: Mobile-friendly with theme toggle
- **Performance Monitoring**: Built-in performance tracking
- **PDF Reader**: Custom PDF viewing capabilities
- **Contact Forms**: With reCAPTCHA protection
- **Error Boundaries**: Graceful error handling throughout

### Database Schema
- **Users**: Profiles, roles, MyLCI numbers
- **Projects**: Categorized service projects with images
- **Courses**: LMS content and progress tracking
- **All-Rounders**: Member recognition data
- **Certificates**: Generated for course completion

### Security Features
- Security headers (X-Frame-Options, CSP, etc.)
- reCAPTCHA protection on forms
- Environment-based configuration
- Role-based API access control
- Input validation and sanitization

## Development

### Prerequisites
- Node.js 18.17.0 or higher
- Firebase project with auth, Firestore, and storage
- Environment variables configured

### Environment Variables
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=

# Google Analytics
NEXT_PUBLIC_GA_ID=

# Google Site Verification
GOOGLE_SITE_VERIFICATION=
```

### Getting Started
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run analyze` - Bundle analysis

## Deployment & Performance

### Optimizations
- Image optimization with WebP/AVIF formats
- Lazy loading for images and components
- Bundle splitting and code optimization
- Service worker capabilities (PWA)
- Compressed responses with gzip

### SEO & Analytics
- Comprehensive metadata and structured data
- Google Analytics integration
- Open Graph and Twitter cards
- XML sitemaps and robots.txt
- Schema.org markup for organization

## Content Management

### Adding Projects
Use the admin dashboard or create project entries in Firestore with:
- Title, description, category
- Date, venue, impact metrics
- Image gallery and metadata

### User Roles
- **member**: Default role, can access LMS and basic features
- **trainer**: Can create and manage courses
- **admin**: Can manage projects and users
- **superadmin**: Full system access

## Maintenance

### Database Backups
Regular Firebase backups recommended for:
- User data and profiles
- Project content and images
- Course progress and certificates

### Performance Monitoring
Built-in performance tracking monitors:
- Core Web Vitals
- Page load times
- User interaction metrics
- Error rates and exceptions

## Contributing

1. Follow the existing code style and TypeScript patterns
2. Test responsive design on multiple devices
3. Ensure accessibility standards are met
4. Update documentation for new features
5. Run type checking and linting before commits

## License & Contact

- **Organization**: Leo District 306 D7
- **Email**: leodistrict306d7@gmail.com
- **Phone**: +94 77 624 3300
- **Website**: https://d7leos.org

---
