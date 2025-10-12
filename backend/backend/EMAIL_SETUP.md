# Email Verification Setup Guide

## Overview
This guide will help you set up email verification for the Vistapro application using Resend as the email service provider.

## Prerequisites
- Node.js and npm installed
- PostgreSQL database running
- Resend account (free tier available)

## Step 1: Install Dependencies

Run the following command in the backend directory:
```bash
npm install resend
```

## Step 2: Set Up Resend Account

1. Go to [resend.com](https://resend.com) and create a free account
2. Verify your domain or use the provided sandbox domain
3. Get your API key from the dashboard
4. Add the API key to your `.env` file:
   ```
   RESEND_API_KEY=re_your_api_key_here
   ```

## Step 3: Environment Variables

Add these variables to your `.env` file:

```env
# Email Configuration
RESEND_API_KEY=re_your_resend_api_key_here
FRONTEND_URL=http://localhost:5173

# Other required variables
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url
SESSION_SECRET=your_session_secret
```

## Step 4: Run Database Migration

Execute the email verification migration:
```bash
npm run migrate
```

This will add the following columns to your users table:
- `email_verified` (boolean)
- `email_verification_token` (varchar)
- `email_verification_expires` (timestamp)
- `email_verification_sent_at` (timestamp)

## Step 5: Test the Integration

1. Start your backend server: `npm run dev`
2. Start your frontend: `npm run dev` (in frontend directory)
3. Register a new user account
4. Check your email for the verification link
5. Click the link to verify your email
6. Try logging in with the verified account

## API Endpoints

### Registration
- **POST** `/api/auth/register` - Register new user with email verification

### Email Verification
- **GET** `/api/auth/verify-email/:token` - Verify email with token
- **POST** `/api/auth/resend-verification` - Resend verification email

### Password Reset
- **POST** `/api/auth/forgot-password` - Request password reset
- **POST** `/api/auth/reset-password` - Reset password with token

## Frontend Routes

- `/verify-email` - Email verification page
- `/reset-password` - Password reset page

## Email Templates

The system includes two email templates:
1. **Verification Email** - Sent when users register
2. **Password Reset Email** - Sent when users request password reset

Both templates are styled with your brand colors and include:
- Professional HTML layout
- Responsive design
- Clear call-to-action buttons
- Security information

## Security Features

- **Token Expiration**: Verification tokens expire after 24 hours
- **Password Reset Expiration**: Reset tokens expire after 1 hour
- **Secure Token Generation**: Uses crypto.randomBytes for secure tokens
- **Input Validation**: All endpoints include proper validation
- **Rate Limiting**: Already configured in your app

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check your Resend API key
   - Verify your domain is configured in Resend
   - Check the console for error messages

2. **Verification links not working**
   - Ensure FRONTEND_URL is set correctly
   - Check that the token hasn't expired
   - Verify the database migration ran successfully

3. **Database errors**
   - Run the migration: `npm run migrate`
   - Check your DATABASE_URL configuration
   - Ensure PostgreSQL is running

### Alternative Email Providers

If you prefer a different email service, you can easily swap Resend for:

- **SendGrid** (100 emails/day free)
- **Mailgun** (5,000 emails/month for 3 months)
- **Brevo** (300 emails/day free)

Just update the `emailService.js` file with the new provider's SDK.

## Production Deployment

For production deployment:

1. Update `FRONTEND_URL` to your production domain
2. Configure a custom domain in Resend
3. Update the "from" email address in `emailService.js`
4. Set `NODE_ENV=production` in your environment variables

## Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure your database migration completed successfully
4. Test with a different email address if needed
