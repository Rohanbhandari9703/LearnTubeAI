import express from 'express';
import axios from 'axios';
const router = express.Router();

// POST /api/youtube/search
router.post('/search', async (req, res) => {
  const { query, maxDuration } = req.body;
  try {
    // Search YouTube videos (fetch more to filter out Shorts)
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API}`;
    const searchRes = await axios.get(searchUrl);
    const videos = searchRes.data.items;
    if (!videos || videos.length === 0) return res.status(404).json({ error: 'No video found' });

    // Collect all video IDs
    const videoIds = videos.map(v => v.id.videoId).join(',');
    // Get details for all videos
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds}&key=${process.env.YOUTUBE_API}`;
    const detailsRes = await axios.get(detailsUrl);
    const detailsList = detailsRes.data.items;

    // Parse ISO 8601 duration
    const parseDuration = (iso) => {
      const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(match[1] || '0');
      const mins = parseInt(match[2] || '0');
      const secs = parseInt(match[3] || '0');
      return hours * 60 + mins + secs / 60;
    };

    // Filter: not a Short (>=2 min), duration within 10 min of maxDuration, and collect likes/comments
    const minDuration = 2; // minutes
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
        if (maxDuration && (video.duration > maxDuration || (maxDuration - video.duration) > 10)) return false;
        return true;
      });

    // Sort by likes and comments (descending)
    filtered.sort((a, b) => {
      // Sort by likeCount first, then commentCount
      if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
      return b.commentCount - a.commentCount;
    });

    if (filtered.length === 0) {
      return res.status(400).json({ error: 'No video found within duration' });
    }

    // Return the top video details
    res.json(filtered[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
