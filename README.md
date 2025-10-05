# OVM System

A comprehensive vehicle transport management system designed for professional fleet operations with advanced authentication, mobile driver workflows, and automated document generation.

## 🚀 Production Features

- **Production Authentication**: JWT-based security with bcrypt password hashing
- **Role-Based Access**: Admin and Driver interfaces with proper authorization
- **Mobile-Optimized**: Responsive design for field operations
- **Document Automation**: POC/POD generation with professional invoice templates
- **Email Integration**: Automated document delivery via SMTP
- **File Management**: Organized storage with intelligent compression
- **Expense Management**: Driver expense submission with approval workflow
- **Real-Time Dashboard**: Live job tracking and revenue analytics

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **shadcn/ui** components with Tailwind CSS
- **TanStack Query** for state management
- **Wouter** for routing

### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** with Drizzle ORM
- **JWT** authentication with rate limiting
- **Sharp** for image compression
- **PDFKit** for document generation
- **Nodemailer** for email automation

## 🔧 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- SMTP email service (optional)

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

3. **Initialize database**
```bash
npm run db:push
```

4. **Create admin user**
```bash
npx tsx server/scripts/setup-auth.ts
```

5. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📱 User Roles

### Administrator
- Full system access and management
- Job creation and assignment
- Customer and driver management
- Invoice generation and tracking
- User account management
- System settings and configuration

### Driver
- Mobile-optimized dashboard
- Assigned job viewing
- Collection/delivery workflows
- Damage reporting with photos
- Expense submission
- Enhanced process documentation

## 🔐 Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** using bcrypt with salt rounds
- **Rate Limiting** to prevent brute force attacks
- **Security Headers** including CSP and HSTS
- **Role-Based Authorization** for API endpoints
- **Session Management** with automatic token refresh

## 📊 Key Features

### Job Management
- GMT timezone-based job numbering (DDMMYYXXX)
- Six-stage workflow tracking
- DVLA vehicle lookup integration
- Google Maps distance calculation
- Automated status updates

### Document Generation
- Professional invoice templates with OVM branding
- Proof of Collection (POC) documents
- Proof of Delivery (POD) documents
- Automated email delivery
- PDF compression and optimization

### Mobile Workflow
- Environmental condition tracking
- Comprehensive vehicle checklists
- Multi-stage photo capture
- Digital signature collection
- Damage documentation

### File Management
- Organized job folder structure
- Premium image compression (85% quality)
- Intelligent storage optimization
- Monthly archive system
- Professional file naming

## 🌐 Production Deployment

### Environment Setup
```bash
NODE_ENV=production
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=your-password
```

### Build for Production
```bash
npm run build
npm start
```

### Health Check
```
GET /health
```

Returns system health status and metrics.

## 📈 System Capacity

- **Storage**: Optimized for 3,000+ jobs with 50 photos each
- **Compression**: 70-75% reduction in image storage
- **Performance**: Sub-second API response times
- **Scalability**: Serverless-ready architecture

## 🛠️ API Documentation

### Authentication
```bash
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/users (admin only)
```

### Jobs
```bash
GET /api/jobs
POST /api/jobs
GET /api/jobs/:id
PATCH /api/jobs/:id
```

### Enhanced Workflows
```bash
POST /api/jobs/enhanced-process
POST /api/job-process-records
POST /api/damage-reports
```

## 📞 Support

For technical support or questions about the OVM System, please contact your system administrator.

## 🔄 Version History

**v1.0.0** - Production Release
- Complete authentication system
- Enhanced mobile workflows
- Professional document generation
- Automated email integration
- Production-ready deployment

---

© 2025 OVM. All rights reserved.