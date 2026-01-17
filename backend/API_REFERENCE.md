# API Reference Guide

Quick reference for all backend APIs.

## Base URL
```
http://localhost:5000
```

---

## Authentication APIs

### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Note:** Cookie is automatically set (HTTP-only)

---

### Logout
```http
POST /api/auth/logout
Cookie: token=jwt_token
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get Current User
```http
GET /api/auth/me
Cookie: token=jwt_token
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## Playlist APIs

### Create Playlist
```http
POST /api/playlists
Cookie: token=jwt_token
Content-Type: application/json

{
  "topic": "React",
  "playlistData": [
    {
      "subtopic": "Components",
      "importance": "high",
      "timeAllocated": 30,
      "videoTitle": "React Components Tutorial",
      "videoUrl": "https://youtube.com/watch?v=..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "playlist": {
    "_id": "playlist_id",
    "userId": "user_id",
    "topic": "React",
    "playlistData": [...],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Get All Playlists
```http
GET /api/playlists
Cookie: token=jwt_token
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "playlists": [
    {
      "_id": "playlist_id_1",
      "topic": "React",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "playlist_id_2",
      "topic": "Node.js",
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

---

### Get Single Playlist
```http
GET /api/playlists/:id
Cookie: token=jwt_token
```

**Response:**
```json
{
  "success": true,
  "playlist": {
    "_id": "playlist_id",
    "userId": "user_id",
    "topic": "React",
    "playlistData": [...],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Delete Playlist
```http
DELETE /api/playlists/:id
Cookie: token=jwt_token
```

**Response:**
```json
{
  "success": true,
  "message": "Playlist deleted successfully"
}
```

---

## Progress APIs

### Update Progress
```http
POST /api/progress
Cookie: token=jwt_token
Content-Type: application/json

{
  "playlistId": "playlist_id",
  "videoId": "youtube_video_id",
  "videoUrl": "https://youtube.com/watch?v=...",
  "completed": true
}
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "_id": "progress_id",
    "userId": "user_id",
    "playlistId": "playlist_id",
    "videoId": "youtube_video_id",
    "videoUrl": "https://youtube.com/watch?v=...",
    "completed": true,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Get Progress for Playlist
```http
GET /api/progress/:playlistId
Cookie: token=jwt_token
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "progress": [
    {
      "_id": "progress_id_1",
      "videoId": "video_id_1",
      "videoUrl": "https://youtube.com/watch?v=...",
      "completed": true
    },
    {
      "_id": "progress_id_2",
      "videoId": "video_id_2",
      "videoUrl": "https://youtube.com/watch?v=...",
      "completed": false
    }
  ]
}
```

---

## Saved Video APIs

### Save Video
```http
POST /api/saved-videos
Cookie: token=jwt_token
Content-Type: application/json

{
  "playlistId": "playlist_id",
  "videoId": "youtube_video_id",
  "title": "React Tutorial",
  "thumbnail": "https://i.ytimg.com/vi/.../default.jpg",
  "videoUrl": "https://youtube.com/watch?v=..."
}
```

**Response:**
```json
{
  "success": true,
  "savedVideo": {
    "_id": "saved_video_id",
    "userId": "user_id",
    "playlistId": "playlist_id",
    "videoId": "youtube_video_id",
    "title": "React Tutorial",
    "videoUrl": "https://youtube.com/watch?v=...",
    "savedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Get All Saved Videos
```http
GET /api/saved-videos
Cookie: token=jwt_token
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "savedVideos": [
    {
      "_id": "saved_video_id_1",
      "playlistId": {
        "_id": "playlist_id",
        "topic": "React"
      },
      "videoId": "youtube_video_id",
      "title": "React Tutorial",
      "videoUrl": "https://youtube.com/watch?v=...",
      "savedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Delete Saved Video
```http
DELETE /api/saved-videos/:videoId
Cookie: token=jwt_token
```

**Response:**
```json
{
  "success": true,
  "message": "Video removed from saved list"
}
```

---

## Error Responses

All APIs return errors in this format:

```json
{
  "error": "Error message here"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not authorized to access resource)
- `404` - Not Found
- `500` - Server Error

---

## Frontend Integration Example

### Using Axios with Cookies

```javascript
import axios from 'axios';

// Configure axios to send cookies
axios.defaults.withCredentials = true;

// Login
const login = async (email, password) => {
  const res = await axios.post('http://localhost:5000/api/auth/login', {
    email,
    password
  });
  return res.data;
};

// Save Playlist
const savePlaylist = async (topic, playlistData) => {
  const res = await axios.post('http://localhost:5000/api/playlists', {
    topic,
    playlistData
  });
  return res.data;
};

// Update Progress
const updateProgress = async (playlistId, videoId, videoUrl, completed) => {
  const res = await axios.post('http://localhost:5000/api/progress', {
    playlistId,
    videoId,
    videoUrl,
    completed
  });
  return res.data;
};
```

---

## Notes

1. **All private routes require authentication** - Include `Cookie: token=jwt_token` header
2. **Cookies are HTTP-only** - Automatically sent by browser, no manual header needed in frontend
3. **User ID is extracted from JWT** - Never send userId from frontend
4. **CORS is configured** - Make sure frontend URL is in CORS config
5. **All timestamps are in ISO format** - UTC timezone
