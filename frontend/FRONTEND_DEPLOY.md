# Frontend Deployment & Backend Integration Guide

This guide explains how to connect your frontend to the Railway-deployed backend.

## 🔗 **Step-by-Step Integration Process**

### Step 1: Get Your Railway Backend URL

1. **Deploy Backend to Railway** (if not done already):
   - Follow the `RAILWAY_DEPLOY.md` guide in the backend folder
   - Wait for deployment to complete

2. **Get Railway URL**:
   - Go to your Railway dashboard
   - Click on your backend service
   - Copy the URL (format: `https://your-app.railway.app`)

### Step 2: Configure Frontend Environment

1. **Update .env file** with your Railway backend URL:
   ```env
   REACT_APP_API_URL=https://your-actual-railway-url.railway.app
   ```

2. **Example**:
   ```env
   # Replace with your actual Railway URL
   REACT_APP_API_URL=https://chat-viz-backend-production.railway.app
   ```

### Step 3: Update Backend CORS (Important!)

1. **Add Frontend URL to Railway Environment Variables**:
   - Go to Railway → Your Backend Service → Variables
   - Add: `FRONTEND_URL=https://your-frontend-domain.com`
   - This allows your frontend to communicate with the backend

### Step 4: Test Local Frontend with Railway Backend

1. **Start Frontend Locally**:
   ```bash
   cd frontend
   npm start
   ```

2. **Verify Connection**:
   - Frontend runs on `http://localhost:3000`
   - API calls go to `https://your-app.railway.app`
   - Check browser console for successful API connections

### Step 5: Deploy Frontend (Optional)

You can deploy the frontend to various platforms:

#### Option A: Vercel (Recommended)
1. **Install Vercel CLI**: `npm i -g vercel`
2. **Deploy**: `vercel --prod`
3. **Set Environment Variable**: Add `REACT_APP_API_URL` in Vercel dashboard

#### Option B: Netlify
1. **Build**: `npm run build`
2. **Deploy**: Drag `build/` folder to netlify.com
3. **Environment Variables**: Add `REACT_APP_API_URL` in site settings

#### Option C: Railway (Frontend)
1. **Create new Railway service** for frontend
2. **Set build command**: `npm run build`
3. **Set start command**: `npx serve -s build`
4. **Add environment variable**: `REACT_APP_API_URL`

## 🔧 **Configuration Details**

### Frontend API Configuration (Already Set Up)
```javascript
// src/services/apiService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

### Backend CORS Configuration (Already Set Up)
```javascript
// backend/src/server.js
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,  // Your deployed frontend URL
];
```

## 🧪 **Testing the Integration**

### Local Testing Checklist:
- ✅ Backend deployed to Railway
- ✅ Frontend `.env` updated with Railway URL
- ✅ Frontend starts without errors
- ✅ API calls succeed (check Network tab)
- ✅ SSE connection established (real-time updates work)
- ✅ Questions can be submitted and answered

### Production Testing Checklist:
- ✅ Frontend deployed to hosting platform
- ✅ Backend CORS updated with frontend URL
- ✅ All API endpoints accessible
- ✅ Real-time features working
- ✅ Error handling displays proper messages

## 🚨 **Troubleshooting**

### Common Issues:

1. **CORS Error**:
   ```
   Access to fetch at 'railway-url' from origin 'frontend-url' has been blocked by CORS
   ```
   **Fix**: Add frontend URL to backend's `FRONTEND_URL` environment variable

2. **API 404 Errors**:
   ```
   GET https://railway-url/api/questions 404
   ```
   **Fix**: Verify Railway backend URL is correct and backend is running

3. **SSE Connection Fails**:
   ```
   EventSource connection to 'railway-url/api/stream' failed
   ```
   **Fix**: Check Railway logs, ensure backend SSE endpoint is working

4. **Environment Variables Not Loading**:
   **Fix**: Ensure `.env` file is in frontend root and variables start with `REACT_APP_`

### Debugging Steps:
1. **Check Railway Backend**: Visit `https://your-app.railway.app/health`
2. **Check Frontend Console**: Look for API request logs
3. **Check Network Tab**: Verify API calls are going to correct URLs
4. **Check Railway Logs**: Look for backend errors or CORS blocks

## 🌐 **Production Deployment URLs**

After deployment, you'll have:
- **Backend**: `https://your-backend.railway.app`
- **Frontend**: `https://your-frontend.vercel.app` (or other platform)

Both will communicate seamlessly with proper environment configuration!

## 📝 **Quick Setup Summary**

1. Deploy backend to Railway → Get URL
2. Update frontend `.env` with Railway URL
3. Test locally: `npm start`
4. Deploy frontend with environment variables
5. Update backend CORS with frontend URL
6. Test production integration

**Your chat-to-visualization app will be fully deployed and functional! 🎉**