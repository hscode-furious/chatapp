# MongoDB Connection Guide

## Common Authentication Errors and Solutions

### Error: "Authentication failed" or "bad auth"

This error occurs when MongoDB cannot authenticate with the provided credentials.

#### Solution 1: Check Your Connection String Format

**For Local MongoDB:**
```env
MONGODB_URI=mongodb://username:password@localhost:27017/database_name
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```

#### Solution 2: URL Encode Special Characters

If your password contains special characters, you MUST URL encode them:

| Character | URL Encoded |
|-----------|------------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |
| `?` | `%3F` |
| `/` | `%2F` |
| `:` | `%3A` |
| ` ` (space) | `%20` |

**Example:**
If your password is `P@ssw0rd#123`, the connection string should be:
```
mongodb+srv://username:P%40ssw0rd%23123@cluster.mongodb.net/database
```

#### Solution 3: Verify MongoDB Atlas Credentials

1. Go to MongoDB Atlas: https://cloud.mongodb.com
2. Click on "Database Access" in the left menu
3. Check your username and password
4. Make sure the user has "Read and write to any database" permissions
5. Click "Edit" to reset password if needed

#### Solution 4: Check IP Whitelist (MongoDB Atlas)

1. Go to MongoDB Atlas
2. Click on "Network Access" in the left menu
3. Click "Add IP Address"
4. For development, you can temporarily add `0.0.0.0/0` (allows all IPs)
5. Click "Confirm"

#### Solution 5: Use MongoDB Atlas Connection String

1. Go to your MongoDB Atlas cluster
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password (URL encoded if needed)
6. Replace `<dbname>` with your database name

**Example:**
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority
```

## Local MongoDB Setup

### Option 1: Install MongoDB Locally

1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Use connection string:
   ```env
   MONGODB_URI=mongodb://localhost:27017/chatapp
   ```

### Option 2: Use MongoDB Docker

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Then use:
```env
MONGODB_URI=mongodb://localhost:27017/chatapp
```

## Testing Your Connection

### Test Connection String Format

1. **Check if .env file exists:**
   ```bash
   cd Backend
   ls -la .env
   ```

2. **Verify environment variable is loaded:**
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"
   ```

3. **Test connection manually:**
   ```bash
   node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected!')).catch(err => console.error('Error:', err.message))"
   ```

## Common Connection String Examples

### Local MongoDB (No Authentication)
```env
MONGODB_URI=mongodb://localhost:27017/chatapp
```

### Local MongoDB (With Authentication)
```env
MONGODB_URI=mongodb://admin:password123@localhost:27017/chatapp?authSource=admin
```

### MongoDB Atlas (Standard)
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority
```

### MongoDB Atlas (With Special Characters in Password)
If password is `P@ss#123`:
```env
MONGODB_URI=mongodb+srv://username:P%40ss%23123@cluster0.xxxxx.mongodb.net/chatapp
```

## Troubleshooting Steps

1. ✅ **Check .env file exists** in Backend directory
2. ✅ **Verify MONGODB_URI is set** in .env file
3. ✅ **Check username and password** are correct
4. ✅ **URL encode special characters** in password
5. ✅ **Verify database user permissions** in MongoDB Atlas
6. ✅ **Check IP whitelist** in MongoDB Atlas
7. ✅ **Restart backend server** after changing .env
8. ✅ **Check MongoDB service is running** (for local)

## Quick Fix Script

If you're having trouble with special characters, use this Node.js script:

```javascript
// encode-password.js
const password = process.argv[2];
if (!password) {
  console.log('Usage: node encode-password.js "your-password"');
  process.exit(1);
}
const encoded = encodeURIComponent(password);
console.log(`Original: ${password}`);
console.log(`Encoded:  ${encoded}`);
```

Run it:
```bash
node encode-password.js "P@ss#123"
```

Then use the encoded version in your connection string.

