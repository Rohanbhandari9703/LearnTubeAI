import express from 'express';
import axios from 'axios';
const router = express.Router();

// POST /api/youtube/search
router.post('/search', async (req, res) => {
  const { query, maxDuration, language } = req.body; // maxDuration is in minutes

  try {
    // 5️⃣ Convert ISO Duration -> Seconds
    const parseDurationToSeconds = (iso) => {
      const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(match[1] || '0');
      const mins = parseInt(match[2] || '0');
      const secs = parseInt(match[3] || '0');
      return hours * 3600 + mins * 60 + secs;
    };

    const targetTimeSeconds = (maxDuration || 30) * 60;
    const searchMaxResults = 50; // 3️⃣ Fetch More Results

    // 1️⃣ Enrich the Query (Intent Optimization)
    const enrichedQuery = `${query} tutorial lecture explained for beginners`;

    // 2️⃣ Use videoDuration Parameter
    let durationParam = 'medium'; // 4-20 min
    if (maxDuration > 20) durationParam = 'long'; // > 20 min
    if (maxDuration < 4) durationParam = 'any';

    console.log(`🔍 YouTube search for: "${enrichedQuery}" (target: ${maxDuration} min, durationParam: ${durationParam})`);

    // Search YouTube videos
    let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${searchMaxResults}&q=${encodeURIComponent(enrichedQuery)}&videoDuration=${durationParam}&key=${process.env.YOUTUBE_API}`;

    if (language) {
      searchUrl += `&relevanceLanguage=${language}`;
    }

    const searchRes = await axios.get(searchUrl);
    const videos = searchRes.data.items;

    if (!videos || videos.length === 0) {
      console.log('❌ No videos found in search');
      return res.status(404).json({ error: 'No video found' });
    }

    // 4️⃣ Call videos.list for Details (contentDetails, statistics)
    console.log('📡 Getting detailed video info for filtering...');
    const videoIds = videos.map(v => v.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds}&key=${process.env.YOUTUBE_API}`;
    const detailsRes = await axios.get(detailsUrl);
    const detailsList = detailsRes.data.items;

    if (!detailsList || detailsList.length === 0) {
      return res.status(404).json({ error: 'Detailed video info not found' });
    }

    const maxViews = Math.max(...detailsList.map(v => parseInt(v.statistics?.viewCount || '0')), 1);

    const trustedChannels = [
      'Gate Smashers',
      'Apna College',
      'Neso Academy',
      'freeCodeCamp.org',
      'MIT OpenCourseWare',
      'MIT OCW',
      'CodeWithHarry',
      'Striver',
      'Take U Forward'
    ];

    // 🧠 Phase 3 & 4 — Remove Bad Videos & Score
    const scoredVideos = detailsList
      .map(details => {
        const durationSeconds = parseDurationToSeconds(details.contentDetails.duration);
        const views = parseInt(details.statistics?.viewCount || '0');
        const likes = parseInt(details.statistics?.likeCount || '0');
        const channelTitle = details.snippet.channelTitle;

        // 6️⃣ Remove Shorts (duration < 180s)
        if (durationSeconds < 180) return null;

        // 7️⃣ Remove Videos Too Long (target + 5 mins)
        if (durationSeconds > targetTimeSeconds + 300) return null;

        // 8️⃣ Remove Extremely Low-Quality Videos
        if (views < 1000) return null;

        // 9️⃣ Normalize Views
        const normalizedViews = views / maxViews;

        // 🔟 Compute Like Ratio
        const likeRatio = views > 0 ? likes / views : 0;

        // 1️⃣1️⃣ Duration Fit Score
        const durationFit = 1 - Math.abs(durationSeconds - targetTimeSeconds) / targetTimeSeconds;

        // 1️⃣2️⃣ Combine Into Final Score
        let score = (0.5 * normalizedViews) + (0.3 * likeRatio) + (0.2 * durationFit);

        // 1️⃣3️⃣ Trusted Channel Bonus
        const isTrusted = trustedChannels.some(tc => channelTitle.toLowerCase().includes(tc.toLowerCase()));
        if (isTrusted) {
          score += 0.2;
        }

        return {
          videoTitle: details.snippet.title,
          videoUrl: `https://www.youtube.com/watch?v=${details.id}`,
          videoId: details.id,
          thumbnail: details.snippet.thumbnails?.medium?.url,
          duration: durationSeconds,
          durationFormatted: details.contentDetails.duration,
          channel: channelTitle,
          views,
          likes,
          score,
          isTrusted
        };
      })
      .filter(v => v !== null)
      // 1️⃣4️⃣ Sort by Final Score
      .sort((a, b) => b.score - a.score);

    if (scoredVideos.length === 0) {
      console.log('❌ No videos found matching criteria after filtering');
      return res.status(404).json({ error: 'No suitable videos found' });
    }

    // 🧠 Phase 7 — Match Study Time (Greedy approach)
    const selectedVideos = [];
    let remainingTime = targetTimeSeconds;

    for (const video of scoredVideos) {
      if (video.duration <= remainingTime + 180) { // allow 3 min buffer
        selectedVideos.push(video);
        remainingTime -= video.duration;
      }
      if (remainingTime < 180) break; // Stop when remaining time < 3 minutes
    }

    // If greedy selection picked nothing (e.g. all videos > target but < target+5)
    // just pick the top scored one
    if (selectedVideos.length === 0 && scoredVideos.length > 0) {
      selectedVideos.push(scoredVideos[0]);
      remainingTime -= scoredVideos[0].duration;
    }

    const totalDurationSelected = selectedVideos.reduce((acc, v) => acc + v.duration, 0);

    console.log(`✅ Selected ${selectedVideos.length} videos. Total duration: ${Math.floor(totalDurationSelected / 60)}m ${totalDurationSelected % 60}s`);

    // 1️⃣6️⃣ Send Playlist-Ready Data
    return res.json({
      query: enrichedQuery,
      videos: selectedVideos,
      totalDuration: totalDurationSelected,
      remainingTime: Math.max(0, remainingTime),
      targetTime: targetTimeSeconds,
      count: selectedVideos.length
    });

  } catch (err) {
    console.log('❌ YouTube search error:', err.message);
    if (err.response) {
      console.log('⚠️ Error details:', err.response.data);
    }
    res.status(500).json({ error: 'Failed to fetch and optimize YouTube results' });
  }
});

export default router;
