# ⚡ Quick Production Testing Guide

## **🚀 LIVE PRODUCTION URLS**

- **Website**: https://www.vistapro.ng
- **Backend**: https://vistapro-backend.onrender.com

---

## **📧 Test Email Verification (5 Steps)**

1. **Go to**: https://www.vistapro.ng
2. **Register** a new user with your real email
3. **Check email** (including spam folder)
4. **Click verification link** in the email
5. **Login** with your credentials

---

## **✅ What You Should See**

### **Email:**
- Subject: "Verify Your Email Address"
- Link: `https://www.vistapro.ng/email-verification?token=XXXXX`

### **After Clicking Link:**
- Success message: "Email verified successfully!"
- Redirect to login page
- Can now log in

---

## **🐛 Quick Troubleshooting**

| Problem | Solution |
|---------|----------|
| No email received | Check spam folder, wait 1-2 minutes |
| Link doesn't work | Check if link points to `https://www.vistapro.ng` |
| Token invalid | Token expired (24 hours) or already used |
| Page not loading | Check Vercel deployment status |

---

## **🔗 Useful Links**

- **Render Logs**: https://dashboard.render.com
- **Vercel Logs**: https://vercel.com/dashboard
- **Resend Dashboard**: https://resend.com/emails

---

**Ready to test?** Go to https://www.vistapro.ng and register! 🎉

