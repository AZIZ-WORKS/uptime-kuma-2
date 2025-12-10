# Debugging Van Dashboard Button

## Check These:

1. **Are there any vans in the list?**
   - Open browser console (F12)
   - Check if `rows` array has items
   - The button only shows if there are vans

2. **Check browser console for errors:**
   - Open DevTools (F12)
   - Look for any JavaScript errors
   - Check Network tab for failed requests

3. **Verify the route works:**
   - Try navigating directly to: `/vans/van1` (or your van ID)
   - This will tell us if routing is the issue

4. **Check if Link component is imported:**
   - Should be: `import { Link } from 'react-router-dom';`

5. **Hard refresh browser:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)
   - Or clear browser cache

6. **Check Docker container logs:**
   ```bash
   docker logs dashboard-frontend --tail 50
   ```

7. **Verify the built files:**
   ```bash
   docker exec dashboard-frontend ls -la /usr/share/nginx/html/assets/
   ```

## Current Button Code Location:
- File: `frontend/src/pages/Vans.jsx`
- Lines: 92-97
- Should appear right after "Show Devices" button

## Button Styling:
- Blue background (`bg-blue-600`)
- White text
- Padding: `px-5 py-2`
- Border and shadow for visibility
- Minimum width: 140px
