import express from 'express';
import axios from 'axios';
const router = express.Router();

// POST /api/youtube/search
router.post('/search', async (req, res) => {
  const { query, maxDuration } = req.body;

  try {
    const parseDuration = (iso) => {
      const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(match[1] || '0');
      const mins = parseInt(match[2] || '0');
      const secs = parseInt(match[3] || '0');
      return hours * 60 + mins + secs / 60;
    };

    const minDuration = 2; // minutes - minimum video duration
    const searchMaxResults = 50; // fetch more results to get better options

    console.log(`🔍 YouTube search for: "${query}" (max duration: ${maxDuration} min)`);
    
    // Search YouTube videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${searchMaxResults}&q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API}`;
    const searchRes = await axios.get(searchUrl);
    const videos = searchRes.data.items;

    if (!videos || videos.length === 0) {
      console.log('❌ No videos found in search');
      return res.status(404).json({ error: 'No video found' });
    }

    // Get detailed info for all videos (duration, statistics)
    console.log('📡 Getting detailed video info for filtering...');
    const videoIds = videos.map(v => v.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds}&key=${process.env.YOUTUBE_API}`;
    const detailsRes = await axios.get(detailsUrl);
    const detailsList = detailsRes.data.items;

    // Filter and score videos: duration >= minDuration AND duration < maxDuration
    const filtered = detailsList
      .map(details => {
        const duration = parseDuration(details.contentDetails.duration);
        const likeCount = details.statistics?.likeCount ? parseInt(details.statistics.likeCount) : 0;
        const commentCount = details.statistics?.commentCount ? parseInt(details.statistics.commentCount) : 0;
        const viewCount = details.statistics?.viewCount ? parseInt(details.statistics.viewCount) : 0;
        
        // Calculate engagement score (likes + comments normalized by views, with bonus for comments)
        const engagementScore = viewCount > 0 
          ? ((likeCount + commentCount * 2) / viewCount) * 1000000 
          : 0;

        return {
          videoTitle: details.snippet.title,
          videoUrl: `https://www.youtube.com/watch?v=${details.id}`,
          duration,
          likeCount,
          commentCount,
          viewCount,
          engagementScore, // Higher is better
        };
      })
      .filter(video => {
        // Filter out shorts (videos less than 2 minutes)
        if (video.duration < minDuration) return false;
        // Only include videos with duration less than maxDuration
        if (maxDuration && video.duration >= maxDuration) return false;
        return true;
      });

    // Sort by engagement score (primary), then likes, then comments
    filtered.sort((a, b) => {
      // Primary sort: engagement score (most relevant metric)
      if (Math.abs(b.engagementScore - a.engagementScore) > 0.1) {
        return b.engagementScore - a.engagementScore;
      }
      // Secondary sort: likes
      if (b.likeCount !== a.likeCount) {
        return b.likeCount - a.likeCount;
      }
      // Tertiary sort: comments
      return b.commentCount - a.commentCount;
    });

    if (filtered.length === 0) {
      console.log('❌ No videos found matching duration criteria');
      return res.status(404).json({ error: 'No video found within duration range' });
    }

    console.log(`✅ Found ${filtered.length} videos matching criteria`);
    
    // Return array of videos (sorted by engagement)
    return res.json({
      videos: filtered,
      currentIndex: 0, // Always start with index 0
      totalVideos: filtered.length
    });
  } catch (err) {
    console.log('❌ YouTube search error:', err.message);
    console.log('⚠️ Error response:', err.response?.data || 'No response data');
    res.status(500).json({ error: err.message });
  }
});

export default router;
