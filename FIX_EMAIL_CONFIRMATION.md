# Fix "Email Not Confirmed" Error

## Quick Fix (2 Minutes)

### Option 1: Confirm Users Manually (Easiest)

1. **Go to Supabase Dashboard**
2. Click **"Authentication"** → **"Users"**
3. You'll see your users listed

**For each user (admin and agent):**
- Click on the user's email
- Look for **"Email Confirmed"** field
- If it says `false` or shows a confirm button, click it
- Or look for three dots (**•••**) menu → **"Confirm email"**

---

### Option 2: Confirm via SQL (Fast)

Go to **SQL Editor** and run:

```sql
-- Confirm all users
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email IN ('admin@finflow.com', 'agent@finflow.com');
```

Click **"Run"**

---

### Option 3: Recreate Users with Auto-Confirm

If the above doesn't work, **delete and recreate** the users:

1. **Delete existing users:**
   - Go to Authentication → Users
   - Click each user → Click "Delete user"

2. **Delete from app_users table:**
   ```sql
   DELETE FROM public.app_users;
   ```

3. **Create users again** with **Auto Confirm checked:**
   - Authentication → Users → Add user
   - Email: `admin@finflow.com`
   - Password: `password123`
   - ✅ **CHECK "Auto Confirm User"** ← IMPORTANT!
   - Click "Create user"
   - Copy the UUID
   
   Repeat for agent user.

4. **Add to app_users table again** (with new UUIDs):
   ```sql
   INSERT INTO public.app_users (id, role, full_name, mobile_number, email)
   VALUES ('NEW-ADMIN-UUID', 'ADMIN', 'Admin User', '9876543210', 'admin@finflow.com');
   
   INSERT INTO public.app_users (id, role, full_name, mobile_number, email)
   VALUES ('NEW-AGENT-UUID', 'AGENT', 'Field Agent', '9876543211', 'agent@finflow.com');
   ```

---

## ✅ Test Login Again

After confirming emails, try logging in:
- http://localhost:3000
- Email: `admin@finflow.com`
- Password: `password123`

Should work now! 🎉

---

## Still Not Working?

### Check Email Confirmation Status:
```sql
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email IN ('admin@finflow.com', 'agent@finflow.com');
```

- If `email_confirmed_at` is NULL → Email not confirmed
- If `email_confirmed_at` has a timestamp → Email is confirmed ✅

### Disable Email Confirmation (for development only):

Go to **Authentication** → **Settings** → **Email Auth**:
- Find **"Confirm email"**
- Toggle it OFF (for development)

> [!WARNING]
> Only disable email confirmation in development! Re-enable for production.

---

## Why This Happens

Supabase requires email confirmation by default. When creating test users, you must either:
1. Check "Auto Confirm User" when creating them
2. Manually confirm them after creation
3. Or disable email confirmation in Auth settings (dev only)
