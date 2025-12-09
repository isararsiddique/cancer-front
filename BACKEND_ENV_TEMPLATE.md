# Backend Environment Configuration

## Security Warning ⚠️

**NEVER hardcode API credentials in source code!** Always use environment variables.

## Backend .env File Template

Create a `.env` file in your backend directory with these variables:

```bash
# WHO ICD-11 API Configuration
WHO_API_BASE=https://id.who.int
WHO_TOKEN_URL=https://icdaccessmanagement.who.int/connect/token
WHO_API_URL=https://id.who.int/icd/release/11/2025-01
WHO_CLIENT_ID=ebea7984-077e-4366-a655-65531bdb26c5_c389da01-7ffe-42ed-b382-23370ef4ab1f
WHO_CLIENT_SECRET=3SyTLj3I9SH6WQa3XOtnv6NmSAS1oRKryRt7xoIVUTQ=

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/cancer_registry

# JWT Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://98.92.253.206:3000

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

## Update Your Backend Code

In your `icd11.py` file, replace hardcoded credentials with environment variables:

```python
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# WHO API Configuration (from environment variables)
WHO_API_BASE = os.getenv("WHO_API_BASE", "https://id.who.int")
WHO_TOKEN_URL = os.getenv("WHO_TOKEN_URL", "https://icdaccessmanagement.who.int/connect/token")
WHO_API_URL = os.getenv("WHO_API_URL", f"{WHO_API_BASE}/icd/release/11/2025-01")

# Use environment variables for credentials
WHO_CLIENT_ID = os.getenv("WHO_CLIENT_ID")
WHO_CLIENT_SECRET = os.getenv("WHO_CLIENT_SECRET")

# Validate that credentials are set
if not WHO_CLIENT_ID or not WHO_CLIENT_SECRET:
    raise ValueError("WHO_CLIENT_ID and WHO_CLIENT_SECRET must be set in environment variables")
```

## Why This Matters

1. **Security**: Credentials in source code can be exposed in version control
2. **Flexibility**: Different environments (dev, staging, prod) can use different credentials
3. **Best Practice**: Industry standard for managing sensitive configuration
4. **Compliance**: Required for security audits and certifications

## .gitignore

Make sure your `.gitignore` includes:

```
# Environment files
.env
.env.local
.env.*.local
.env.production.local

# But allow templates
!.env.example
!.env.template
```

## For Production Deployment

On your AWS EC2 server, create `/path/to/backend/.env` with production credentials:

```bash
# SSH into your server
ssh user@98.92.253.206

# Navigate to backend directory
cd /path/to/your/backend

# Create .env file
nano .env

# Paste the configuration above
# Save and exit (Ctrl+X, Y, Enter)

# Restart your backend service
sudo systemctl restart your-backend-service
```

## Environment Variable Priority

Most Python frameworks load environment variables in this order:
1. System environment variables
2. `.env` file in project root
3. Default values in code

## Testing

Verify your backend loads credentials correctly:

```python
# In your backend, add a test endpoint (remove after testing)
@app.get("/api/test/config")
async def test_config():
    return {
        "who_api_base": WHO_API_BASE,
        "who_client_id_set": bool(WHO_CLIENT_ID),
        "who_client_secret_set": bool(WHO_CLIENT_SECRET),
        # Never return actual secrets!
    }
```

## Common Issues

**Problem**: Backend can't find WHO credentials
- **Solution**: Check `.env` file exists in backend root directory
- **Solution**: Verify `python-dotenv` is installed: `pip install python-dotenv`
- **Solution**: Ensure `load_dotenv()` is called before accessing variables

**Problem**: WHO API returns 401 Unauthorized
- **Solution**: Verify credentials are correct in `.env` file
- **Solution**: Check if WHO API credentials have expired
- **Solution**: Ensure no extra spaces in credential values

**Problem**: Backend works locally but not in production
- **Solution**: Create `.env` file on production server
- **Solution**: Check file permissions: `chmod 600 .env`
- **Solution**: Restart backend service after creating `.env`
