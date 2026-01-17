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

