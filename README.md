# Ex-Employee Verification Portal

A secure and comprehensive employee verification system built with Next.js, MongoDB, and SendGrid. This portal allows authorized external organizations (BGV agencies, future employers) to verify employment details of ex-employees with features for appeal submission, PDF report generation, and automated email notifications.

## 🚀 Features

### For Verifiers
- **Secure Registration**: Company email-based account creation with personal email blocking
- **Multi-Step Verification**: Intuitive wizard for submitting verification requests
- **Real-time Comparison**: Instant visual feedback with match/mismatch indicators (Green/Red)
- **Appeal System**: Submit appeals with document attachments for discrepancies
- **PDF Reports**: Download official verification reports with company letterhead
- **Email Notifications**: Automatic email updates for appeal responses

### For HR/Admin
- **Admin Dashboard**: Comprehensive dashboard with statistics and trends
- **Appeal Management**: Review and respond to appeals with HR comments
- **Employee Management**: Manage employee database and verification records
- **Email Integration**: Automated email notifications for all major actions
- **PDF Generation**: System-generated official reports
- **Audit Trail**: Complete tracking of all verification activities

## 🏗️ Architecture

### Backend Technologies
- **Framework**: Next.js 15 with App Router
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based secure authentication
- **File Storage**: AWS S3 for document uploads
- **Email Service**: SendGrid for transactional emails
- **PDF Generation**: jsPDF with official letterhead
- **Validation**: Joi for API validation

### Frontend Technologies
- **Framework**: Next.js 15
- **Styling**: Tailwind CSS with DaisyUI
- **UI Components**: Custom components with Framer Motion animations
- **Icons**: Lucide React
- **Charts**: Recharts for dashboard analytics

## 📋 Database Schema

### Employee Model
```javascript
{
  employeeId: String,     // Unique employee ID
  name: String,           // Employee full name
  email: String,          // Employee email
  entityName: String,     // TVSCSHIB/HIB
  dateOfJoining: Date,    // Date of joining
  dateOfLeaving: Date,    // Date of leaving
  designation: String,    // Executive/Assistant Manager/Manager
  exitReason: String,     // Resigned/Terminated/Retired/etc
  fnfStatus: String,      // Completed/Pending
  department: String      // Department name
}
```

### VerificationRecord Model
```javascript
{
  verificationId: String, // Unique verification ID
  employeeId: String,     // Employee reference
  verifierId: ObjectId,   // Verifier reference
  submittedData: Object,  // Data provided by verifier
  comparisonResults: Array, // Detailed comparison results
  overallStatus: String,  // matched/partial_match/mismatch
  matchScore: Number,     // Percentage match score
  pdfReportUrl: String,   // S3 URL to PDF report
  consentGiven: Boolean   // Consent confirmation
}
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB database (MongoDB Atlas recommended)
- AWS S3 bucket for file storage
- SendGrid account for email services
- Netlify account for deployment

### 1. Clone and Install
```bash
git clone <repository-url>
cd ex_employee_verification_portal
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure with your credentials:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your actual values:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/employee-verification

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourcompany.com
COMPANY_NAME=Your Company Name
SUPPORT_EMAIL=hr@yourcompany.com

# AWS S3
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=employee-verification-docs
AWS_REGION=us-east-1

# Application
NEXT_PUBLIC_BASE_URL=https://your-app.netlify.app
NODE_ENV=production
```

### 3. Database Seeding
Initialize your database with sample data:

```bash
node scripts/seedDatabase.js
```

This will create:
- 6 sample employee records including the test case "S Sathish"
- 2 admin accounts (super admin and HR manager)

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 👤 Default Login Credentials

### Admin Accounts
- **Super Admin**: username: `admin`, password: `admin123`
- **HR Manager**: username: `hr_manager`, password: `hr123`

### Test Employee
Use Employee ID: `EMP006` (S Sathish) for testing verification requests.

## 🌐 Deployment (Netlify)

### 1. Configure Netlify Functions
Add to your `netlify.toml` (create if not exists):

```toml
[build]
  command = "npm run build"
  publish = ".next"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Environment Variables in Netlify
Set environment variables in Netlify dashboard:
- Navigate to Site settings → Build & deploy → Environment
- Add all variables from `.env.local`

### 3. Deploy
```bash
npm run build
netlify deploy --prod
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Verifier registration
- `POST /api/auth/login` - Verifier login
- `POST /api/admin/login` - Admin login
- `GET /api/auth/me` - Get user profile

### Verification
- `POST /api/verify/request` - Submit verification request
- `GET /api/verify/request` - Get verification history

### Appeals
- `POST /api/appeals` - Submit appeal with file upload
- `GET /api/appeals` - List appeals (admin)
- `POST /api/admin/appeals/[id]/respond` - Respond to appeal

### Reports
- `POST /api/reports/generate` - Generate PDF report
- `GET /api/reports/generate` - Get existing PDF

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics

## 🔄 Verification Workflow

1. **Verifier Registration**: Create account with company email
2. **Consent Confirmation**: Verify consent from candidate
3. **Data Submission**: Enter employee details from relieving letter
4. **Instant Comparison**: Real-time match/mismatch visualization
5. **Report Generation**: Download official PDF with company letterhead
6. **Appeal Process**: Submit appeals with documents for discrepancies
7. **HR Review**: Admin reviews and responds to appeals
8. **Email Notifications**: Automated updates throughout process

## 📧 Email Templates

### Verification Report Email
- Professional letterhead design
- Detailed comparison table
- PDF attachment
- Contact information

### Appeal Notifications
- New appeal alerts to HR
- Appeal response notifications to verifiers
- Include supporting documents

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Company Email Validation**: Blocks personal email domains
- **Password Hashing**: bcrypt with salt rounds
- **API Rate Limiting**: Prevent abuse
- **Input Validation**: Comprehensive validation with Joi
- **File Upload Security**: Type and size validation
- **CORS Configuration**: Proper cross-origin settings

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Step-by-step Wizard**: Intuitive verification flow
- **Visual Feedback**: Color-coded match/mismatch indicators
- **Form Validation**: Real-time input validation
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages
- **Animations**: Smooth transitions with Framer Motion

## 🛠️ Development

### File Structure
```
app/
├── api/                    # API routes
│   ├── auth/              # Authentication endpoints
│   ├── admin/             # Admin endpoints
│   ├── verify/            # Verification endpoints
│   ├── appeals/           # Appeal endpoints
│   └── reports/           # Report generation
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── admin/             # Admin dashboard components
│   ├── verify/            # Verification wizard components
│   └── ui/                # UI components
lib/
├── models/                # Database models
├── services/              # Business logic services
├── auth.js                # Authentication utilities
├── validation.js          # Validation schemas
└── mongodb.js             # Database connection
scripts/
└── seedDatabase.js        # Database seeding
```

### Database Models
- **Employee**: Employee information
- **Verifier**: Verifier accounts
- **Admin**: Administrator accounts
- **VerificationRecord**: Verification requests
- **Appeal**: Appeal submissions

### Services
- **comparisonService**: Employee data comparison logic
- **fileService**: S3 file upload/download
- **emailService**: SendGrid email integration
- **pdfService**: PDF report generation

## 🚀 Performance Optimizations

- **Database Indexes**: Optimized queries
- **Caching**: MongoDB connection pooling
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Static Generation**: Where applicable
- **CDN**: Netlify edge network

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection**
   - Verify connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure user permissions

2. **Email Service**
   - Verify SendGrid API key
   - Check sender email verification
   - Review email templates

3. **File Uploads**
   - Verify AWS credentials
   - Check S3 bucket permissions
   - Ensure proper CORS configuration

4. **JWT Authentication**
   - Verify JWT secret
   - Check token expiration
   - Validate token structure

### Logs & Debugging
- Check Netlify function logs
- Review browser console
- Monitor MongoDB logs
- Check email service logs

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions:
- Email: hr@company.com
- Created by: Development Team

---

**Note**: This is a production-ready application with comprehensive security, validation, and error handling. Please ensure all environment variables are properly configured before deployment.
