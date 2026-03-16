import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const testSearch = async () => {
    const url = 'http://localhost:5000/api/youtube/search'; // Assuming backend runs on 5000
    const query = 'DBMS normalization';
    const maxDuration = 30;

    try {
        console.log(`🚀 Testing YouTube optimization for: "${query}" with ${maxDuration} min slot...`);
        const response = await axios.post(url, {
            query,
            maxDuration
        });

        const data = response.data;
        console.log('\n--- Test Result ---');
        console.log(`Enriched Query: ${data.query}`);
        console.log(`Total Duration: ${Math.floor(data.totalDuration / 60)}m ${data.totalDuration % 60}s`);
        console.log(`Remaining Time: ${Math.floor(data.remainingTime / 60)}m ${data.remainingTime % 60}s`);
        console.log(`Video Count: ${data.count}`);

        console.log('\nSelected Videos:');
        data.videos.forEach((v, i) => {
            console.log(`${i + 1}. [${Math.floor(v.duration / 60)}m] ${v.title} (${v.channel}) - Score: ${v.score.toFixed(2)} ${v.isTrusted ? '⭐' : ''}`);
        });

    } catch (error) {
        console.error('❌ Test failed:');
        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }
        console.log('\nNote: Make sure the server is running on http://localhost:5000 and YOUTUBE_API is in .env');
    }
};

testSearch();
