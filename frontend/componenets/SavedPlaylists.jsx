import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Trash2, Play, ArrowLeft } from "lucide-react";

export default function SavedPlaylists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/playlists", {
        withCredentials: true,
      });
      setPlaylists(res.data.playlists || []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setError(err.response?.data?.error || "Failed to load playlists");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/playlists/${id}`, {
        withCredentials: true,
      });
      setPlaylists(playlists.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete playlist");
    }
  };

  const handleLoadPlaylist = (playlist) => {
    localStorage.setItem("playlistData", JSON.stringify(playlist.playlistData));
    navigate("/main");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white flex items-center justify-center">
        <div className="text-xl text-zinc-400">Loading playlists...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white px-6 py-20">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Bar */}
        <nav className="mb-8 flex justify-between items-center">
          <div className="text-2xl font-bold">
            <span className="text-blue-500">LearnTube</span> AI
          </div>
          <Link
            to="/main"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition"
          >
            <ArrowLeft size={18} />
            Back to Main
          </Link>
        </nav>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-extrabold mb-8"
        >
          Saved Playlists
        </motion.h1>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-700 text-red-400">
            {error}
          </div>
        )}

        {playlists.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <p className="text-xl mb-4">No saved playlists yet.</p>
            <Link
              to="/main"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Create a playlist to get started
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {playlists.map((playlist) => (
              <motion.div
                key={playlist._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-blue-400 mb-2">
                      {playlist.topic}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Created: {new Date(playlist.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">
                      Videos: {Array.isArray(playlist.playlistData) ? playlist.playlistData.filter(item => item.videoUrl).length : 0}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadPlaylist(playlist)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
                    >
                      <Play size={18} />
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(playlist._id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
