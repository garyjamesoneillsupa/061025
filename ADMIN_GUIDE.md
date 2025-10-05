# Admin Guide: Job Abort/Cancel System

## Overview
The OVM system now includes comprehensive abort/cancel functionality with specialized fee invoicing. This guide explains how to use these admin-only features.

## How to Abort or Cancel a Job

### Step 1: Navigate to Jobs Page
1. Go to `/admin/jobs` (Jobs page in the admin panel)
2. Find the job you want to abort or cancel

### Step 2: Use Admin Controls
- Each job row now shows **admin controls** instead of just a status badge
- You'll see the current status badge PLUS action buttons for eligible jobs

### Step 3: Abort or Cancel
**For jobs that can be aborted/cancelled (not paid, aborted, or cancelled already):**

1. **Abort Job**: Click the red "Abort Job" button
   - Set an abort fee (e.g., £50)
   - Confirm the action
   - Job status changes to "Aborted" (red)

2. **Cancel Job**: Click the orange "Cancel Job" button  
   - Set a cancellation fee (e.g., £25)
   - Confirm the action
   - Job status changes to "Cancelled" (orange)

## Fee Invoice Generation

### After Setting Fees
Once you've aborted or cancelled a job with a fee:

1. **Invoice Button Appears**: You'll see a blue "Invoice [Type] Fee" button
2. **Generate Invoice**: Click to create a specialized PDF invoice
3. **Automatic Features**:
   - Uses job number format: `INV-{JobNumber}-ABORT` or `INV-{JobNumber}-CANCEL`
   - Professional PDF with company branding
   - Specialized description: "Vehicle Abort Fee" or "Cancellation Fee"
   - 30-day payment terms
   - Saves to job folder structure

## System Features

### Status Colors (Consistent Across All Pages)
- **Created**: Gray
- **Assigned**: Pink  
- **Collected**: Amber
- **Delivered**: Green
- **Invoiced**: Blue
- **Paid**: Black
- **Aborted**: Red *(new)*
- **Cancelled**: Orange *(new)*

### Calendar/Planner Behavior
- **All jobs remain visible** on the Planner regardless of status
- Aborted and cancelled jobs show with their respective colors
- Complete company overview maintained as requested

### Admin-Only Controls
- Only admin users see the abort/cancel buttons
- Regular users and drivers see read-only status badges
- Role-based access control enforced

## Where to Find These Features

1. **Jobs Page** (`/admin/jobs`): Primary location for abort/cancel actions
2. **Individual Job Details**: Admin controls available on job detail pages
3. **Planner** (`/admin/planner`): View all jobs with new status colors
4. **Dashboard**: Quick reference guide (new admin actions section)

## Invoice Storage
- Specialized fee invoices save to: `Jobs/{Month Year}/{JobNumber}/Documents/`
- Filename format: `INV-{JobNumber}-ABORT.pdf` or `INV-{JobNumber}-CANCEL.pdf`
- Professional template matching regular invoices but with specialized descriptions

## Database Fields Added
- `aborted_at`: Timestamp when job was aborted
- `cancelled_at`: Timestamp when job was cancelled  
- `abort_fee`: Decimal field for abort fee amount
- `cancellation_fee`: Decimal field for cancellation fee amount

The system maintains complete audit trails and professional documentation for all abort/cancel actions.