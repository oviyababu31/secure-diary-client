```markdown
# Secure E-Diary — Client (React)

1. Edit client/src/api.js and set API_BASE to the server address, e.g.:
   export const API_BASE = 'http://192.168.1.100:4000';

   Or set env variable before starting:
   REACT_APP_API_BASE=http://192.168.1.100:4000 npm start

2. Install and run:
   cd client
   npm install
   npm start

Access the client at http://localhost:3000 in your browser.

Notes:
- Server must be reachable from the client machine (same LAN, port open).
- The key is a numeric shift for the Caesar cipher (e.g., 3).
```