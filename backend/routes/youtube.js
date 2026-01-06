import express from 'express';
import axios from 'axios';
const router = express.Router();

// POST /api/youtube/search
router.post('/search', async (req, res) => {
  const { query, maxDuration: initialMaxDuration } = req.body;
  const threshold = 5; // minutes to increase on each retry
  const maxRetries = 4; // max 4 retries (20 minutes extra)
  let retryCount = 0;
  let currentMaxDuration = initialMaxDuration;

  try {
    const parseDuration = (iso) => {
      const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(match[1] || '0');
      const mins = parseInt(match[2] || '0');
      const secs = parseInt(match[3] || '0');
      return hours * 60 + mins + secs / 60;
    };

    const minDuration = 2; // minutes

    while (retryCount <= maxRetries) {
      console.log(`🔍 YouTube search attempt ${retryCount} for: "${query}"`);
      // Search YouTube videos (fetch more to filter out Shorts)
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API}`;
      console.log('📡 Search URL:', searchUrl.substring(0, 100) + '...');
      const searchRes = await axios.get(searchUrl);
      console.log('📦 Search response status:', searchRes.status);
      console.log('📦 Search response items count:', searchRes.data.items ? searchRes.data.items.length : 0);
      const videos = searchRes.data.items;

      if (!videos || videos.length === 0) {
        console.log('❌ No videos found in search');
        return res.status(404).json({ error: 'No video found' });
      }

      // First attempt: try to filter from search results alone
      if (retryCount === 0) {
        // Get the first video from search results
        const firstVideo = videos[0];
        if (firstVideo) {
          console.log('✅ Returning first search result:', firstVideo.snippet.title);
          return res.json({
            videoTitle: firstVideo.snippet.title,
            videoUrl: `https://www.youtube.com/watch?v=${firstVideo.id.videoId}`
          });
        }
      }

      // Retry attempts: get detailed info for filtering
      console.log('📡 Getting detailed video info...');
      const videoIds = videos.map(v => v.id.videoId).join(',');
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds}&key=${process.env.YOUTUBE_API}`;
      const detailsRes = await axios.get(detailsUrl);
      console.log('📦 Details response status:', detailsRes.status);
      console.log('📦 Details response items count:', detailsRes.data.items ? detailsRes.data.items.length : 0);
      const detailsList = detailsRes.data.items;

      // Filter by duration
      let filtered = detailsList
        .map(details => {
          const duration = parseDuration(details.contentDetails.duration);
          return {
            videoTitle: details.snippet.title,
            videoUrl: `https://www.youtube.com/watch?v=${details.id}`,
            duration,
            likeCount: details.statistics && details.statistics.likeCount ? parseInt(details.statistics.likeCount) : 0,
            commentCount: details.statistics && details.statistics.commentCount ? parseInt(details.statistics.commentCount) : 0
          };
        })
        .filter(video => {
          if (video.duration < minDuration) return false;
          if (currentMaxDuration && (video.duration > currentMaxDuration || (currentMaxDuration - video.duration) > currentMaxDuration / 2)) return false;
          return true;
        });

      // Sort by likes and comments (descending)
      filtered.sort((a, b) => {
        if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
        return b.commentCount - a.commentCount;
      });

      // If we found videos, return the top one
      if (filtered.length > 0) {
        return res.json(filtered[0]);
      }

      // No videos found, increase duration and retry
      retryCount++;
      if (retryCount <= maxRetries) {
        currentMaxDuration += threshold;
      }
    }

    // All retries exhausted
    res.status(400).json({ error: 'No video found within duration range' });
  } catch (err) {
    console.log('❌ YouTube search error:', err.message);
    console.log('⚠️ Error response:', err.response?.data || 'No response data');
    res.status(500).json({ error: err.message });
  }
});

export default router;
