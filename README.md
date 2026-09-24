# Workscape Maintenance — React Migration V1

This is the React version of the original Vanilla JS maintenance prototype.
Built as a learning project for React, Git, GitHub, and web deployment.

## What changed

Old structure:
- overview.html
- new-request.html + new-request.js
- database.html + database.js
- app.js

React structure:
- src/App.jsx — owns the main `requests` State and page State
- src/components/Layout.jsx — shared header/navigation/layout
- src/components/Toast.jsx — toast UI
- src/pages/Overview.jsx — dashboard/summary UI
- src/pages/NewRequest.jsx — controlled form + Form State
- src/pages/Database.jsx — filters, list rendering, request detail modal, admin update
- src/data.js — master/static data
- src/utils.js — localStorage + formatting/file helpers
- src/styles.css — reused from the original prototype
- public/assets — reused Workscape images

## React concepts intentionally used

- Components
- State / useState
- Props
- Parent → Child data flow
- Function Props / Child triggers Parent action
- map() + key
- Conditional rendering
- Controlled inputs
- Form State → submit → Object → Parent Main State
- Immutable Array updates with spread / map / filter

`useEffect` and React Router are intentionally NOT required in this version so the code stays within the React foundation already learned.

## Run

```bash
npm install
npm run dev
```

Then open the Local URL shown by Vite (normally http://localhost:5173).

## Important learning flow

`App.jsx` is the best starting point:

```text
App
├─ Main State: requests
├─ addRequest()
├─ updateRequest()
│
├─ Overview       ← Props: requests
├─ NewRequest     ← Props + calls addRequest()
└─ Database       ← Props + calls updateRequest()
```

The existing browser localStorage key is preserved, so the React version can reuse the prototype's saved maintenance data in the same browser/origin when available.
