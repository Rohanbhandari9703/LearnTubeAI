import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.YOUTUBE_API;

if (!API_KEY) {
  console.log('❌ YOUTUBE_API is not set in .env');
  process.exit(1);
}

console.log('🔑 API Key loaded (last 8 chars):', API_KEY.slice(-8));

const testSearch = async () => {
  try {
    console.log('\n🔍 Testing YouTube API...');
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=javascript&key=${API_KEY}`;
    console.log('📡 Requesting:', url.substring(0, 80) + '...');
    
    const response = await axios.get(url);
    
    console.log('\n✅ SUCCESS! API is working');
    console.log('Status:', response.status);
    console.log('Videos found:', response.data.items?.length);
    if (response.data.items?.length > 0) {
      console.log('First video:', response.data.items[0].snippet.title);
    }
  } catch (err) {
    console.log('\n❌ ERROR:');
    console.log('Status:', err.response?.status);
    console.log('Message:', err.message);
    console.log('Response data:', err.response?.data);
    
    if (err.response?.status === 403) {
      console.log('\n⚠️ 403 Forbidden - Check these:');
      console.log('1. Is YouTube Data API v3 enabled in Google Cloud Console?');
      console.log('2. Does your API key have usage quota remaining?');
      console.log('3. Is your API key restricted to certain IPs/domains?');
    }
  }
};

testSearch();
