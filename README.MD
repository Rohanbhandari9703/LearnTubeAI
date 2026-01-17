# AI-Based YouTube Playlist Generator 📺🤖

An AI-powered web application built using the **MERN stack** that automatically generates structured and prioritized YouTube playlists for any study topic. The system intelligently assigns **higher weightage to important subtopics** using a defined algorithm, embeds videos directly inside the app, and allows users to track their learning progress.

---

## 🚀 Project Overview

Students often waste time searching for the right YouTube videos and deciding what to study first. This application solves that problem by using **AI-driven topic breakdown** combined with a **weightage distribution algorithm** to generate optimized YouTube playlists where critical topics receive more focus.

The platform provides an end-to-end learning flow — from topic input to embedded video playback and progress tracking.

---

## ✨ Features Implemented

### ✅ AI-Powered Topic Breakdown
- Uses **Gemini API** to:
  - Break a topic into meaningful subtopics
  - Assign an importance level to each subtopic
  - Maintain a logical learning order

### ✅ Weightage Distribution Algorithm
- Important subtopics are prioritized using a **defined weight-based system**
- Higher importance topics receive:
  - More videos
  - Higher learning focus
- Ensures balanced syllabus coverage while emphasizing critical concepts

### ✅ Automated YouTube Playlist Generation
- Fetches videos using **YouTube Data API**
- Videos are selected based on:
  - Subtopic relevance
  - Assigned weightage
- Automatically forms a structured playlist

### ✅ Embedded YouTube Player
- Videos play directly inside the application
- No redirection to YouTube

### ✅ Progress Tracking System
- Checkbox provided for each video
- Users can mark videos as completed
- Displays:
  - Completed videos count
  - Remaining videos
  - Overall progress percentage

### ✅ User Authentication & Data Persistence
- **User Registration & Login**: Secure email/password authentication
- **JWT-based Authentication**: HTTP-only cookies for secure sessions
- **Playlist Saving**: Save generated playlists to your account
- **Progress Tracking**: Track learning progress across all playlists
- **Saved Videos**: Save favorite videos for later viewing
- **User-specific Data**: All data is user-specific and secure

### ✅ Clean & Focused User Interface
- Simple, distraction-free layout
- Designed for efficient learning

---

## 🧠 Weightage Distribution Algorithm (Core Logic)

The application follows a **deterministic algorithm** to ensure important topics receive more attention.

### Step 1: Topic Decomposition
- The Gemini API breaks the main topic into multiple subtopics
- Each subtopic is assigned an **importance level**:
  - High
  - Medium
  - Low

### Step 2: Assign Numerical Weights
| Importance Level | Weight Value |
|------------------|-------------|
| High             | 3           |
| Medium           | 2           |
| Low              | 1           |

### Step 3: Normalize Weights
- Total weight is calculated as the sum of all subtopic weights
- Each subtopic’s relative weight is computed using:

AI-YouTube-Playlist-Generator/
│
├── backend/
│   ├── config/                  # Configuration files
│   │   └── db.js               # MongoDB connection
│   ├── controllers/            # Route controllers
│   │   ├── authController.js   # Authentication logic
│   │   ├── playlistController.js
│   │   ├── progressController.js
│   │   └── savedVideoController.js
│   ├── middleware/             # Express middleware
│   │   ├── auth.js             # JWT authentication
│   │   └── errorHandler.js     # Error handling
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Playlist.js
│   │   ├── Progress.js
│   │   └── SavedVideo.js
│   ├── routes/                 # API routes
│   │   ├── auth.js             # Auth routes
│   │   ├── playlists.js        # Playlist routes
│   │   ├── progress.js         # Progress routes
│   │   ├── savedVideos.js       # Saved video routes
│   │   ├── gemini.js           # AI subtopic generation
│   │   ├── youtube.js           # YouTube search
│   │   └── timeAllocator.js     # Time allocation
│   ├── .env                    # Environment variables (not committed)
│   ├── .gitignore              # Backend git ignore
│   ├── index.js                # Backend entry point
│   ├── package.json            # Backend dependencies
│   ├── package-lock.json
│   └── BACKEND_ARCHITECTURE.md  # Detailed backend documentation
│
├── frontend/
│   ├── components/             # Reusable React components
│   ├── src/                    # React source code
│   ├── public/                 # Static assets
│   ├── node_modules/           # Frontend dependencies
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json            # Frontend dependencies
│   ├── package-lock.json
│   ├── vite.config.js
│   └── README.md               # Frontend-specific README (optional)
│
├── README.md                   # Main project README
└── .gitignore                  # Root git ignore

git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

npm start
