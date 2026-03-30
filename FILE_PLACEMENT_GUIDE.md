# File Placement Guide

This guide shows where each file should be placed in your React project structure.

## 📂 Project Structure

```
your-react-app/
├── public/
├── src/
│   ├── components/
│   │   └── run/
│   │       └── CreateRunModal.tsx          ← Place this file here
│   ├── pages/
│   │   ├── HomePage.tsx                    ← Place this file here
│   │   ├── DashboardPage.tsx               ← Place this file here
│   │   ├── AttackTestingPage.tsx           ← Existing file (keep as-is)
│   │   └── DefenseTestingPage.tsx          ← Existing file (keep as-is)
│   ├── services/
│   │   ├── api.ts                          ← Existing file (keep as-is)
│   │   └── websocket.ts                    ← NEW - Place this file here
│   ├── store/
│   │   └── appStore.ts                     ← Existing file (keep as-is)
│   ├── types/
│   │   └── index.ts                        ← Existing file (keep as-is)
│   ├── utils/
│   │   └── run.ts                          ← Existing file (keep as-is)
│   ├── App.tsx                             ← REPLACE with new version
│   ├── index.tsx                           ← Existing file (keep as-is)
│   └── index.css                           ← Existing file (keep as-is)
├── .env                                     ← Create from .env.example
├── .env.example                             ← Place this file here
├── package.json                             ← MERGE with existing (see notes below)
├── BACKEND_CONTRACT.md                      ← Place in project root
├── README.md                                ← REPLACE existing or place in root
└── IMPLEMENTATION_SUMMARY.md                ← Place in project root (optional)
```

## 🔧 Installation Steps

### 1. Copy Files to Correct Locations

```bash
# From your download/output directory

# Pages (NEW)
cp HomePage.tsx src/pages/
cp DashboardPage.tsx src/pages/

# Components (NEW)
cp CreateRunModal.tsx src/components/run/

# Services (NEW)
cp websocket.ts src/services/

# Root files (REPLACE)
cp App.tsx src/

# Configuration (NEW)
cp .env.example ./
cp BACKEND_CONTRACT.md ./
cp README.md ./
cp IMPLEMENTATION_SUMMARY.md ./
```

### 2. Update package.json

**IMPORTANT**: Do NOT replace your entire package.json. Instead, add these dependencies:

```bash
npm install socket.io-client@^4.7.2
npm install --save-dev @types/socket.io-client@^3.0.0
```

OR manually add to your existing `package.json`:

```json
{
  "dependencies": {
    "socket.io-client": "^4.7.2",
    // ... your existing dependencies
  },
  "devDependencies": {
    "@types/socket.io-client": "^3.0.0",
    // ... your existing dev dependencies
  }
}
```

### 3. Create Environment File

```bash
# Copy the example
cp .env.example .env

# Edit .env with your backend URLs
# REACT_APP_API_URL=http://localhost:3001/api
# REACT_APP_SOCKET_URL=http://localhost:3001
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm start
```

## 📋 Files You Already Have (Keep These)

These files exist in your uploaded code and should NOT be replaced:

- ✅ `src/pages/AttackTestingPage.tsx`
- ✅ `src/pages/DefenseTestingPage.tsx`
- ✅ `src/services/api.ts`
- ✅ `src/store/appStore.ts`
- ✅ `src/types/index.ts`
- ✅ `src/utils/run.ts`
- ✅ `src/index.tsx`
- ✅ `src/components/run/SessionCard.tsx` (not used in current version)
- ✅ `src/components/run/TemplateCard.tsx` (not used in current version)
- ✅ `src/components/run/BackendConfigForm.tsx` (not used in current version)

## 📄 New Files You Need to Add

### Required (Application Won't Work Without These)

1. **`src/services/websocket.ts`** - WebSocket service for real-time updates
2. **`src/pages/HomePage.tsx`** - New homepage with introduction
3. **`src/pages/DashboardPage.tsx`** - Dashboard for run management
4. **`src/components/run/CreateRunModal.tsx`** - Modal for creating runs
5. **`src/App.tsx`** - Updated root component with WebSocket init

### Configuration

6. **`.env.example`** - Environment variable template
7. **`.env`** - Your actual environment config (create from example)

### Documentation (Recommended)

8. **`BACKEND_CONTRACT.md`** - API specification for backend team
9. **`README.md`** - Updated project documentation
10. **`IMPLEMENTATION_SUMMARY.md`** - Change summary (optional)

## ⚙️ Configuration Notes

### Environment Variables

Your `.env` file should contain:

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

**For Production:**
```env
REACT_APP_API_URL=https://your-production-backend.com/api
REACT_APP_SOCKET_URL=https://your-production-backend.com
```

### Backend Requirements

For the app to work, you need a backend that implements:

1. REST API endpoints (see `BACKEND_CONTRACT.md`)
2. Socket.io server with room-based events
3. CORS enabled for your frontend domain

## 🔍 Verification Checklist

After copying files, verify:

- [ ] All files in correct directories
- [ ] `socket.io-client` installed
- [ ] `.env` file created with backend URLs
- [ ] No TypeScript errors
- [ ] App compiles successfully
- [ ] Homepage loads
- [ ] Can navigate to Dashboard
- [ ] Console shows WebSocket connection attempt

## 🐛 Common Issues

### Issue: "Module not found: socket.io-client"
**Solution**: Run `npm install socket.io-client`

### Issue: "Cannot find module './pages/HomePage'"
**Solution**: Ensure `HomePage.tsx` is in `src/pages/`

### Issue: WebSocket connection fails
**Solution**: Check `.env` has correct `REACT_APP_SOCKET_URL`

### Issue: TypeScript errors in websocket.ts
**Solution**: Run `npm install --save-dev @types/socket.io-client`

## 📞 Need Help?

1. Check `IMPLEMENTATION_SUMMARY.md` for detailed changes
2. Review `BACKEND_CONTRACT.md` for API requirements
3. Read `README.md` for usage guide

---

**Quick Start Command:**

```bash
# After copying all files to correct locations
npm install && npm start
```
