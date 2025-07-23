import React, { useState } from 'react';
import axios from 'axios';
function App() {
  const [subject, setSubject] = useState("");
  const [time, setTime] = useState("");
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setPlan([]);
    try {
      const res = await axios.post("http://localhost:5000/api/chat", {
        input: subject,
        totalMinutes: Number(time)
      });
      setPlan(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Network error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-purple-700">Smart Study Planner</h2>
        <div className="space-y-4">
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Enter subject or topic..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Available study time (minutes)"
            min={1}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <button
          className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
          onClick={handleGenerate}
          disabled={loading || !subject || !time}
        >
          {loading ? "Generating..." : "Generate content"}
        </button>
        {error && <div className="mt-4 text-red-500 text-center">{error}</div>}
        {plan.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-purple-600">Your Study Plan</h3>
            <ul className="space-y-4">
              {plan.map((item, idx) => (
                <li key={idx} className="bg-purple-50 p-4 rounded-lg shadow">
                  <div className="font-bold text-purple-700">{item.subtopic}</div>
                  <div className="text-sm text-gray-600">Importance: <span className="font-semibold">{item.importance}</span></div>
                  <div className="text-sm text-gray-600">Allocated Time: <span className="font-semibold">{item.timeAllocated} min</span></div>
                  {item.videoUrl ? (
                    <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 text-blue-600 hover:underline">
                      🎬 {item.videoTitle}
                    </a>
                  ) : (
                    <div className="mt-2 text-gray-400">No video found</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
