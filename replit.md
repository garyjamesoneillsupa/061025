# OVM Pro - Progressive Web App (PWA)

## Overview
OVM Pro is a professional vehicle transport management system delivered as a Progressive Web App (PWA), designed to significantly enhance mobile workforce productivity. Its primary purpose is to provide a comprehensive, gold-standard solution for vehicle collection and delivery workflows, featuring robust offline capabilities, real-time data synchronization, and professional document generation (POCs/PODs) that precisely match invoice templates. The system is production-ready, featuring enterprise-grade security, comprehensive vulnerability mitigation, and fully operational service architecture.

## User Preferences
- Language: English
- Focus: Performance optimization and mobile-first design
- Priority: Fast loading times and offline reliability
- Mobile PWA users should bypass admin features and go directly to driver portal
- Desktop users should retain full admin access
- Camera Interface: Must use native iOS camera interface - custom camera components don't work reliably on iOS devices

## System Architecture
The system employs a modern web stack with a focus on responsive performance and resilience for field operations.
- **Frontend**: React.js with TypeScript, built as a PWA leveraging `shadcn/ui` components and Tailwind CSS. Routing is handled by Wouter, and state management by TanStack Query (React Query).
- **Backend**: Node.js with Express.
- **Database**: PostgreSQL, managed with Drizzle ORM.
- **UI/UX Decisions**: Inspired by industry standards, featuring a dark theme with slate-800 cards, high-contrast white SVG vehicle outlines for damage marking, and a mobile-first, touch-optimized interface. Professional document layouts with consistent styling and improved readability.
- **Key Technical Implementations**:
    - **Offline-First Design**: Utilizes IndexedDB for local storage of jobs, photos, forms, and API requests, enabling complete driver workflow functionality without an internet connection. Background synchronization ensures data consistency when connectivity is restored.
    - **Document Generation**: Professional POC (Proof of Collection) and POD (Proof of Delivery) documents are generated using PDFKit. These documents precisely match invoice templates with embedded vehicle data, photos, environmental conditions, and digital signatures, handling all data scenarios gracefully including missing information.
    - **Image Handling**: Implements a photo optimization engine that compresses images (max 1200x1200px, 70% JPEG quality) before upload, reducing file sizes and improving upload performance.
    - **Driver Workflows**: Features comprehensive, multi-step workflows for vehicle collection (7 steps) and delivery (4 steps), including detailed vehicle checks, interactive damage assessment, photo capture, and digital signature capabilities. Both workflows maintain identical professional quality and user experience.
    - **Data Persistence**: A comprehensive JSON structure is used for vehicle inspection data, with all photo categories and inspection details stored in PostgreSQL, supported by robust auto-save functionality.
    - **Performance Optimizations**: Includes bundle size reduction, optimized service worker caching strategies, lazy loading, and asynchronous initialization for offline capabilities. **Lightning-Fast Completion System**: Collection completion leverages auto-saved data from the database, sending only signature + timestamp (~200 bytes) instead of massive payloads (50MB+), reducing completion time from 10+ minutes to under 2 seconds.
    - **Camera Integration**: Leverages native HTML file input with the `capture` attribute for direct camera access on mobile devices.
    - **Email Notification System**: Automated email system with multi-recipient support based on customer-specific notification settings. POC and POD emails are triggered automatically by job status changes, while invoice emails require manual admin approval. Includes professional HTML templates.
    - **Driver Portal Job Filtering**: Smart job filtering to streamline driver workflow, showing only "assigned" and "collected" status jobs. Delivered jobs automatically disappear from the driver's view and are handled by the backend.
    - **Wages Management System**: Comprehensive weekly driver wage tracking with automated 50% commission calculation based on completed job values. Features week-by-week navigation, payment status tracking, job breakdown per driver, and professional UI with gradient cards matching expense page design.
    - **Financial Reports & Analytics**: Full-featured reporting system with Profit & Loss statements, visual charts (revenue trends, expense breakdown, profit margins), and flexible date range filtering (weekly, monthly, custom periods). Includes automated P&L calculations distinguishing between pass-through fuel expenses (customer-paid, profit-neutral) and absorbed expenses (company-paid, profit-reducing).
    - **HMRC Export System**: Automated generation of VAT-ready compliance packages including ZIP files with all expense receipts (professionally named and organized) and Excel spreadsheets containing detailed expense records with VAT calculations. Prepared for future VAT registration with pre-configured 20% VAT fields.
    - **Security Hardening**: Implemented comprehensive security measures including environment variable-based JWT secret management, robust path traversal protection, strengthened Content Security Policy, request size limits, rate limiting, and enhanced file upload security.
    - **Code Quality**: Achieved clean TypeScript compilation with zero errors across the codebase, ensuring enhanced type safety and code reliability. Resolved all critical service architecture issues, ensuring all services are properly initialized and operational.

## External Dependencies
- **PostgreSQL**: Relational database for persistent data storage.
- **Drizzle ORM**: Object-Relational Mapper for interacting with PostgreSQL.
- **PDFKit**: Library used for generating professional PDF documents.
- **XLSX**: Excel spreadsheet generation for HMRC compliance exports.
- **Archiver**: ZIP file creation for bundling receipts and reports.
- **Recharts**: Data visualization library for charts and graphs in financial reports.
- **React.js**: Frontend JavaScript library.
- **TypeScript**: Superset of JavaScript for type safety.
- **Node.js**: JavaScript runtime for the backend.
- **Express**: Web application framework for Node.js.
- **TanStack Query (React Query)**: Data fetching and state management library.
- **Wouter**: Small routing library for React.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **shadcn/ui**: Component library built with Tailwind CSS.
- **IndexedDB**: Browser-based NoSQL database for offline data storage.