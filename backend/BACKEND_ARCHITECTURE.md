# Backend Architecture Documentation

## Overview
Complete MERN-stack backend implementation for LearnTube AI with authentication, database design, and user-based data storage.

---

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── playlistController.js # Playlist CRUD operations
│   ├── progressController.js # Progress tracking
│   └── savedVideoController.js # Saved videos management
├── middleware/
│   ├── auth.js               # JWT authentication middleware
│   └── errorHandler.js       # Global error handling
├── models/
│   ├── User.js               # User schema
│   ├── Playlist.js           # Playlist schema
│   ├── Progress.js           # Progress schema
│   └── SavedVideo.js         # Saved video schema
├── routes/
│   ├── auth.js               # Auth routes
│   ├── playlists.js          # Playlist routes
│   ├── progress.js           # Progress routes
│   ├── savedVideos.js        # Saved video routes
│   ├── gemini.js             # AI subtopic generation (existing)
│   ├── youtube.js            # YouTube search (existing)
│   └── timeAllocator.js      # Time allocation (existing)
└── index.js                  # Main server file
```

---

## 🗄️ Database Design

### 1. User Collection
**Schema:** `User`
- `name` (String, required)
- `email` (String, required, unique, indexed, validated)
- `password` (String, required, min 6 chars, hashed with bcrypt)
- `createdAt` (Date, auto-generated)
- `timestamps` (createdAt, updatedAt)

**Security:**
- Password hashed using bcrypt (salt rounds: 10)
- Password excluded from queries by default (`select: false`)
- Email validation using regex

---

### 2. Playlist Collection
**Schema:** `Playlist`
- `userId` (ObjectId, ref: User, required, indexed)
- `topic` (String, required)
- `playlistData` (Mixed/JSON, required) - Full AI-generated structure
- `createdAt` (Date, auto-generated)
- `timestamps` (createdAt, updatedAt)

**Indexes:**
- `userId` + `createdAt` (descending) for fast user playlist queries

**Relationships:**
- One user can have many playlists
- Playlists are user-specific (ownership enforced)

---

### 3. Progress Collection
**Schema:** `Progress`
- `userId` (ObjectId, ref: User, required, indexed)
- `playlistId` (ObjectId, ref: Playlist, required, indexed)
- `videoId` (String, required) - YouTube video ID
- `videoUrl` (String, required) - Full YouTube URL
- `completed` (Boolean, default: false)
- `updatedAt` (Date, auto-generated)
- `timestamps` (createdAt, updatedAt)

**Indexes:**
- Compound unique index: `userId` + `playlistId` + `videoId`
- Prevents duplicate progress entries

**Relationships:**
- Progress is user-specific AND playlist-specific
- Separate collection (not embedded) for scalability

---

### 4. SavedVideo Collection
**Schema:** `SavedVideo`
- `userId` (ObjectId, ref: User, required, indexed)
- `playlistId` (ObjectId, ref: Playlist, required)
- `videoId` (String, required)
- `title` (String, required)
- `thumbnail` (String, optional)
- `videoUrl` (String, required)
- `savedAt` (Date, auto-generated)
- `timestamps` (createdAt, updatedAt)

**Indexes:**
- Compound unique index: `userId` + `videoId`
- Prevents duplicate saves

**Relationships:**
- Users can save videos from any playlist
- Videos are user-specific

---

## 🔐 Authentication System

### Technology Stack
- **JWT (jsonwebtoken)** - Token generation and verification
- **bcrypt** - Password hashing
- **HTTP-only cookies** - Secure token storage

### Flow

#### 1. Signup
```
POST /api/auth/signup
Body: { name, email, password }
→ Hash password
→ Create user
→ Generate JWT
→ Set HTTP-only cookie
→ Return user data (without password)
```

#### 2. Login
```
POST /api/auth/login
Body: { email, password }
→ Find user (include password)
→ Compare password with bcrypt
→ Generate JWT
→ Set HTTP-only cookie
→ Return user data
```

#### 3. Logout
```
POST /api/auth/logout
Headers: Cookie with token
→ Clear HTTP-only cookie
→ Return success
```

#### 4. Get Current User
```
GET /api/auth/me
Headers: Cookie with token
→ Verify JWT from cookie
→ Return user data
```

### Security Features
- Passwords never stored in plain text
- JWT stored in HTTP-only cookies (prevents XSS)
- Token expiration: 30 days
- SameSite: strict (CSRF protection)
- Secure flag in production

---

## 🛣️ API Routes

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/signup` | Public | Register new user |
| POST | `/login` | Public | Login user |
| POST | `/logout` | Private | Logout user |
| GET | `/me` | Private | Get current user |

### Playlist Routes (`/api/playlists`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Private | Create new playlist |
| GET | `/` | Private | Get all user playlists |
| GET | `/:id` | Private | Get single playlist (owner only) |
| DELETE | `/:id` | Private | Delete playlist (owner only) |

### Progress Routes (`/api/progress`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Private | Update video progress |
| GET | `/:playlistId` | Private | Get progress for playlist |

### Saved Video Routes (`/api/saved-videos`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Private | Save a video |
| GET | `/` | Private | Get all saved videos |
| DELETE | `/:videoId` | Private | Remove saved video |

---

## 🔒 Security Implementation

### Middleware: `protect`
- Extracts JWT from HTTP-only cookie
- Verifies token signature
- Fetches user from database
- Attaches user to `req.user`
- Returns 401 if unauthorized

### Error Handling
- Centralized error handler middleware
- Handles:
  - Mongoose validation errors
  - Duplicate key errors
  - Invalid ObjectId errors
  - JWT errors
  - Generic server errors

### Input Validation
- Email format validation (regex)
- Password length validation (min 6 chars)
- Required field validation
- MongoDB ObjectId validation

---

## 📊 Data Flow Examples

### Example 1: User Creates and Saves Playlist

1. **User generates playlist** (public endpoint)
   ```
   POST /api/chat
   → Returns playlist data
   ```

2. **User saves playlist** (if logged in)
   ```
   POST /api/playlists
   Headers: Cookie with JWT
   Body: { topic, playlistData }
   → Middleware verifies JWT
   → Extract userId from req.user
   → Create playlist with userId
   → Return saved playlist
   ```

3. **User tracks progress**
   ```
   POST /api/progress
   Headers: Cookie with JWT
   Body: { playlistId, videoId, videoUrl, completed: true }
   → Middleware verifies JWT
   → Extract userId from req.user
   → Upsert progress entry
   → Return progress
   ```

### Example 2: User Retrieves Saved Playlist

1. **Get all playlists**
   ```
   GET /api/playlists
   Headers: Cookie with JWT
   → Middleware verifies JWT
   → Query: Playlist.find({ userId: req.user._id })
   → Return user's playlists
   ```

2. **Get specific playlist**
   ```
   GET /api/playlists/:id
   Headers: Cookie with JWT
   → Middleware verifies JWT
   → Find playlist
   → Verify ownership (playlist.userId === req.user._id)
   → Return playlist
   ```

3. **Get progress for playlist**
   ```
   GET /api/progress/:playlistId
   Headers: Cookie with JWT
   → Middleware verifies JWT
   → Query: Progress.find({ userId, playlistId })
   → Return progress entries
   ```

---

## 🔧 Environment Variables

Required in `.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## 🚀 Usage Examples

### Frontend Integration

#### Login
```javascript
const res = await axios.post('http://localhost:5000/api/auth/login', {
  email: 'user@example.com',
  password: 'password123'
}, {
  withCredentials: true  // Important for cookies
});
```

#### Save Playlist
```javascript
const res = await axios.post('http://localhost:5000/api/playlists', {
  topic: 'React',
  playlistData: [...playlistArray]
}, {
  withCredentials: true
});
```

#### Update Progress
```javascript
const res = await axios.post('http://localhost:5000/api/progress', {
  playlistId: 'playlist_id',
  videoId: 'youtube_video_id',
  videoUrl: 'https://youtube.com/watch?v=...',
  completed: true
}, {
  withCredentials: true
});
```

---

## ✅ Production Checklist

- [x] Password hashing with bcrypt
- [x] JWT authentication
- [x] HTTP-only cookies
- [x] Input validation
- [x] Error handling middleware
- [x] User ownership verification
- [x] Database indexes for performance
- [x] CORS configuration with credentials
- [x] Environment variable usage
- [x] Secure cookie settings for production

---

## 📝 Notes

1. **User ID from JWT**: Never trust userId from frontend. Always extract from `req.user` after JWT verification.

2. **Playlist Data Structure**: The `playlistData` field stores the complete AI-generated structure as-is (Mixed type in Mongoose).

3. **Progress Tracking**: Progress is stored separately from playlists to allow multiple users to track progress on the same playlist structure.

4. **Cookie Security**: In production, set `secure: true` and configure proper CORS origins.

5. **Scalability**: All collections use proper indexes for fast queries as data grows.
