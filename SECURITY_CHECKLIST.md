# Security Checklist

## ✅ Completed

### Frontend
- [x] Backend URL configured via environment variables
- [x] Dashboard-specific authentication implemented
- [x] Token validation on dashboard access
- [x] Automatic token clearing on dashboard switch
- [x] 401 error handling for dashboard mismatches
- [x] No sensitive credentials in frontend code

### Documentation
- [x] Dashboard authentication implementation guide
- [x] Backend environment configuration template
- [x] Quick reference for developers
- [x] Security best practices documented

## ⚠️ Action Required

### Backend Security

- [ ] **Move WHO credentials to environment variables**
  - Remove hardcoded `WHO_CLIENT_ID` from `icd11.py`
  - Remove hardcoded `WHO_CLIENT_SECRET` from `icd11.py`
  - Use `os.getenv()` to load from environment
  - See `backend_icd11_config.py` for example code

- [ ] **Create backend .env file**
  - Create `.env` file in backend root directory
  - Add WHO API credentials
  - Add database credentials
  - Add JWT secret key
  - See `BACKEND_ENV_TEMPLATE.md` for template

- [ ] **Update .gitignore**
  - Ensure `.env` files are not committed to git
  - Add `.env*` to `.gitignore` (except `.env.example`)

- [ ] **Install python-dotenv**
  ```bash
  pip install python-dotenv
  ```

- [ ] **Update backend code**
  - Add `from dotenv import load_dotenv` at top of files
  - Call `load_dotenv()` before accessing environment variables
  - Replace hardcoded credentials with `os.getenv()`

### Production Deployment

- [ ] **Create production .env file on server**
  ```bash
  ssh user@98.92.253.206
  cd /path/to/backend
  nano .env
  # Add production credentials
  ```

- [ ] **Set proper file permissions**
  ```bash
  chmod 600 .env  # Only owner can read/write
  ```

- [ ] **Restart backend service**
  ```bash
  sudo systemctl restart your-backend-service
  # or
  pm2 restart backend
  # or however you run your backend
  ```

- [ ] **Test WHO API integration**
  - Test `/api/token` endpoint
  - Test `/api/icd/{code}` endpoint
  - Verify ICD-11 search works in frontend

### Additional Security Measures

- [ ] **Enable HTTPS**
  - Get SSL certificate (Let's Encrypt)
  - Configure nginx/apache for HTTPS
  - Update frontend to use `https://` URLs

- [ ] **Secure JWT tokens**
  - Use strong SECRET_KEY (at least 32 random characters)
  - Set appropriate token expiration times
  - Implement token refresh mechanism

- [ ] **Database security**
  - Use strong database passwords
  - Restrict database access to localhost or specific IPs
  - Enable SSL for database connections

- [ ] **CORS configuration**
  - Only allow specific origins
  - Don't use wildcard (*) in production

- [ ] **Rate limiting**
  - Implement rate limiting on API endpoints
  - Prevent brute force attacks on login

- [ ] **Logging and monitoring**
  - Log authentication attempts
  - Monitor for suspicious activity
  - Set up alerts for security events

## Testing Checklist

### Authentication Testing

- [ ] Login with hospital user credentials
- [ ] Login with researcher credentials
- [ ] Verify correct dashboard redirection
- [ ] Test dashboard switching (should force re-login)
- [ ] Test token expiration handling
- [ ] Test invalid credentials
- [ ] Test 401 error handling

### API Testing

- [ ] Test hospital endpoints with hospital token
- [ ] Test research endpoints with researcher token
- [ ] Test cross-dashboard access (should fail with 401)
- [ ] Test WHO ICD-11 token endpoint
- [ ] Test ICD-11 search functionality
- [ ] Test token refresh mechanism

### Security Testing

- [ ] Verify credentials not in source code
- [ ] Verify .env files not in git repository
- [ ] Test CORS restrictions
- [ ] Test rate limiting (if implemented)
- [ ] Check for SQL injection vulnerabilities
- [ ] Check for XSS vulnerabilities

## Code Review Checklist

- [ ] No hardcoded credentials in any file
- [ ] All sensitive config uses environment variables
- [ ] Error messages don't expose sensitive information
- [ ] Proper input validation on all endpoints
- [ ] SQL queries use parameterized statements
- [ ] User input is sanitized
- [ ] Authentication required on protected endpoints
- [ ] Dashboard type validated on protected endpoints

## Deployment Checklist

- [ ] Backend .env file created on server
- [ ] Frontend environment variables set correctly
- [ ] Database migrations run
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backup system in place
- [ ] Monitoring and logging configured
- [ ] Documentation updated

## Emergency Procedures

### If Credentials Are Compromised

1. **Immediately rotate credentials**
   - Generate new WHO API credentials
   - Update backend .env file
   - Restart backend service

2. **Invalidate all tokens**
   - Force all users to re-login
   - Clear token blacklist/whitelist

3. **Audit access logs**
   - Check for unauthorized access
   - Identify affected data

4. **Notify stakeholders**
   - Inform security team
   - Document incident

### If Backend Is Down

1. **Check backend service status**
   ```bash
   sudo systemctl status your-backend-service
   ```

2. **Check backend logs**
   ```bash
   tail -f /var/log/your-backend.log
   ```

3. **Verify environment variables**
   ```bash
   cat .env  # Check if file exists and has correct values
   ```

4. **Restart service**
   ```bash
   sudo systemctl restart your-backend-service
   ```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [WHO ICD-11 API Documentation](https://icd.who.int/icdapi)

## Contact

For security issues, contact:
- Security Team: [security@example.com]
- DevOps Team: [devops@example.com]
- On-call: [phone number]
