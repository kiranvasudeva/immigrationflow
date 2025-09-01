# Frontend Verification Checklist

## Automated Verification Process

After making any frontend or API fixes, follow this systematic verification approach:

### 1. Quick Automated Checks
```bash
# Run the verification script
node scripts/verify-frontend.js

# Check for TypeScript errors
npm run type-check 2>/dev/null || echo "Type checking..."

# Check for LSP diagnostics
# Use the get_latest_lsp_diagnostics tool
```

### 2. Visual Verification with mark_completed_and_get_feedback

After fixing an issue, use the `mark_completed_and_get_feedback` tool to:
- Take a screenshot of the current page
- Check console logs for errors
- Verify the UI is rendering correctly
- Get user feedback on the fix

Example usage:
```
mark_completed_and_get_feedback(
  query: "I've fixed [issue]. The form should now [expected behavior]. Can you test it?",
  workflow_name: "Start application",
  website_route: "/relevant-page"
)
```

### 3. Network Request Verification

Check the webview console logs for:
- ✅ 200 status codes for successful requests
- ❌ 500 errors indicating backend issues
- ❌ 400 errors indicating validation problems
- ❌ 404 errors indicating missing endpoints

### 4. Manual Testing Checklist

For each fix, verify:

#### Forms
- [ ] Form renders without errors
- [ ] All required fields are marked
- [ ] Validation messages appear correctly
- [ ] Submit button is enabled/disabled appropriately
- [ ] Form submission doesn't throw console errors
- [ ] Success/error toasts appear after submission

#### CRUD Operations
- [ ] **Create**: New items can be added successfully
- [ ] **Read**: Lists and details load without errors
- [ ] **Update**: Existing items can be edited
- [ ] **Delete**: Items can be removed with confirmation

#### API Integration
- [ ] API calls include proper authentication headers
- [ ] Loading states appear during requests
- [ ] Error states handle failed requests gracefully
- [ ] Data refreshes after mutations

#### UI State
- [ ] Buttons are clickable and responsive
- [ ] Dropdowns/selects populate with data
- [ ] Modals open and close properly
- [ ] Navigation works without errors
- [ ] No blank/empty screens

### 5. Console Error Patterns to Watch For

Common error patterns and their fixes:

| Error Pattern | Likely Cause | Fix |
|--------------|--------------|-----|
| `Cannot read property of undefined` | Missing null checks | Add optional chaining `?.` |
| `Failed to fetch` | CORS or network issue | Check API endpoint URL |
| `400 Bad Request` | Validation error | Check request payload |
| `401 Unauthorized` | Auth issue | Verify authentication |
| `500 Internal Server Error` | Backend error | Check server logs |
| `Hydration mismatch` | SSR/CSR mismatch | Check initial state |

### 6. Workflow Status Checks

Always verify after fixes:
1. Workflow is running (green status)
2. No TypeScript compilation errors
3. Hot Module Replacement (HMR) is working
4. Database connections are active

### 7. Post-Fix Verification Commands

```bash
# Check if server is responding
curl -s http://localhost:5000/health | jq .

# Check database health
curl -s http://localhost:5000/health/db | jq .

# Watch for real-time errors
# Monitor the workflow console logs for errors
```

### 8. Common Fix Verification Patterns

#### After fixing a form:
1. Open the form in browser
2. Check console for errors
3. Fill out the form with valid data
4. Submit and verify success message
5. Check network tab for 200 response
6. Verify data appears in list/table

#### After fixing an API endpoint:
1. Restart the workflow
2. Test the endpoint with curl or browser
3. Check response status and payload
4. Verify frontend receives correct data
5. Check for console errors

#### After fixing a TypeScript error:
1. Run type checking
2. Check LSP diagnostics
3. Verify hot reload applies changes
4. Test affected functionality

### 9. Regression Testing

After any fix, always check:
- [ ] Previously working features still work
- [ ] No new console errors introduced
- [ ] No new TypeScript errors
- [ ] API endpoints still return 200
- [ ] UI components render correctly

### 10. Documentation Update

After successful verification:
1. Update relevant documentation if needed
2. Add comments explaining the fix
3. Update test cases if applicable
4. Document any new patterns discovered