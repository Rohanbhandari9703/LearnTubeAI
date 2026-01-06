import React, { useEffect, useState } from 'react'

export default function Learning() {
  const [data, setData] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('playlistData');
      if (saved) setData(JSON.parse(saved));
    } catch (e) {
      setData(null);
    }
  }, []);

  if (!data) return <div className="p-8">No learning data found. Generate a playlist first.</div>;

  const items = Array.isArray(data) ? data : data.plan || [];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Learning Session</h1>
      {items.length === 0 ? (
        <div>No items in the playlist.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="p-4 bg-white rounded shadow">
              <div className="font-semibold">{it.subtopic || it.title || `Item ${i+1}`}</div>
              {it.videoUrl && (
                <a href={it.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600">
                  Watch video
                </a>
              )}
              <div className="text-sm text-gray-600">Time: {it.timeAllocated || '—'} min</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
