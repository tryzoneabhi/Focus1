import { useState, useEffect } from 'react';
import { Search, Bell, User, Moon, Sun, LayoutDashboard, History, Bookmark, BarChart3, Calendar, Settings, LogOut, ShieldCheck, Play, Clock, Sparkles, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './supabase';
import Onboarding from './components/Onboarding';
import CustomPlayer from './components/CustomPlayer';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [savedVideos, setSavedVideos] = useState<any[]>([]);
  const [aiContent, setAiContent] = useState<{ summary?: string; notes?: string; loading: boolean }>({ loading: false });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchHistory();
      fetchSavedVideos();
    }
  }, [user]);

  const fetchSavedVideos = async () => {
    const { data } = await supabase.from('saved_videos').select('*').eq('user_id', user?.id);
    setSavedVideos(data || []);
  };

  const toggleSaveVideo = async (video: any) => {
    const isSaved = savedVideos.some(v => v.video_id === video.id);
    if (isSaved) {
      await supabase.from('saved_videos').delete().eq('user_id', user?.id).eq('video_id', video.id);
    } else {
      await supabase.from('saved_videos').insert({
        user_id: user?.id,
        video_id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channel: video.channel
      });
    }
    fetchSavedVideos();
  };

  const handleAiAction = async (type: 'summary' | 'notes') => {
    if (!selectedVideo) return;
    setAiContent(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: selectedVideo.title, description: selectedVideo.description || selectedVideo.title })
      });
      const data = await res.json();
      setAiContent({ [type]: data.summary, loading: false });
    } catch (error) {
      console.error("AI Action failed", error);
      setAiContent(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
    setProfile(data);
    if (data?.onboarded) {
      fetchRecommendations(data);
    }
  };

  const fetchHistory = async () => {
    const { data } = await supabase.from('watch_history').select('*').eq('user_id', user?.id).order('last_watched_at', { ascending: false });
    setHistory(data || []);
  };

  const fetchRecommendations = async (userProfile: any) => {
    try {
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: userProfile, history: [] })
      });
      const data = await res.json();
      if (data.recommendations) {
        // Search YouTube for each recommendation
        const allVideos: any[] = [];
        for (const rec of data.recommendations.slice(0, 3)) {
          const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(rec.keywords + " lecture")}&type=video&videoDuration=medium&key=${import.meta.env.VITE_YOUTUBE_API_KEY}&maxResults=5`);
          const ytData = await ytRes.json();
          if (ytData.items) {
            allVideos.push(...ytData.items.map((item: any) => ({
              id: item.id.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails.high.url,
              channel: item.snippet.channelTitle,
              topic: rec.topic
            })));
          }
        }
        setRecommendations(allVideos);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations", error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    // Filtered search
    const q = searchQuery + " educational lecture -shorts";
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&videoDuration=medium&key=${import.meta.env.VITE_YOUTUBE_API_KEY}&maxResults=20`);
    const data = await res.json();
    if (data.items) {
      setVideos(data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
        channel: item.snippet.channelTitle
      })));
      setActiveTab('search');
    }
  };

  const saveWatchTime = async (videoId: string, title: string, time: number) => {
    if (!user) return;
    await supabase.from('watch_history').upsert({
      user_id: user.id,
      video_id: videoId,
      video_title: title,
      watch_time: Math.floor(time),
      last_watched_at: new Date().toISOString()
    }, { onConflict: 'user_id,video_id' });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>;

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Configuration Required</h1>
          <p className="text-slate-600">Please set <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your environment variables to use Focus2.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
              <ShieldCheck size={40} />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Focus2</h1>
            <p className="text-slate-500 mt-2 text-lg">The distraction-free study machine.</p>
          </div>
          <button 
            onClick={signInWithGoogle}
            className="w-full py-4 px-6 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
          <p className="text-xs text-slate-400">By continuing, you agree to our terms of disciplined study.</p>
        </div>
      </div>
    );
  }

  if (profile && !profile.onboarded) {
    return <Onboarding onComplete={fetchProfile} />;
  }

  return (
    <div className={cn("min-h-screen transition-colors duration-300", isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900")}>
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 border-r transition-colors z-50",
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <ShieldCheck size={20} />
          </div>
          <span className="text-xl font-black tracking-tighter">Focus2</span>
        </div>

        <nav className="px-4 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'history', icon: History, label: 'History' },
            { id: 'saved', icon: Bookmark, label: 'Saved' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'planner', icon: Calendar, label: 'Study Planner' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-100">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 transition-colors text-sm font-semibold">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        {/* Top Bar */}
        <header className={cn(
          "sticky top-0 z-40 border-b px-8 py-4 flex items-center justify-between backdrop-blur-md",
          isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-100"
        )}>
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search for lectures, topics, or subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-12 pr-4 py-2.5 rounded-2xl border transition-all text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none",
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100"
              )}
            />
          </form>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
              <img src={user.user_metadata.avatar_url} alt="Profile" />
            </div>
          </div>
        </header>

        <div className="p-8">
          {selectedVideo ? (
            <div className="max-w-5xl mx-auto space-y-6">
              <button onClick={() => setSelectedVideo(null)} className="text-sm font-bold text-blue-600 flex items-center gap-2 mb-4">
                <LayoutDashboard size={16} /> Back to Dashboard
              </button>
              <CustomPlayer 
                videoId={selectedVideo.id} 
                onTimeUpdate={(time) => saveWatchTime(selectedVideo.id, selectedVideo.title, time)}
                onSummaryClick={() => handleAiAction('summary')}
                onNotesClick={() => handleAiAction('notes')}
              />
              
              {aiContent.loading && (
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 animate-pulse flex items-center gap-3">
                  <Sparkles className="text-blue-600 animate-spin" size={20} />
                  <span className="text-blue-700 font-bold">AI is processing the lecture...</span>
                </div>
              )}

              {(aiContent.summary || aiContent.notes) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-8 rounded-3xl border",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl"
                  )}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-blue-600" size={20} />
                    <h3 className="text-lg font-black tracking-tight">AI Insights</h3>
                  </div>
                  <div className="prose prose-slate max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {aiContent.summary || aiContent.notes}
                    </pre>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-black tracking-tight leading-tight">{selectedVideo.title}</h1>
                  <p className="text-slate-500 font-semibold mt-1">{selectedVideo.channel}</p>
                </div>
                <div className="flex gap-3">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSaveVideo(selectedVideo)}
                    className={cn(
                      "px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center gap-2",
                      savedVideos.some(v => v.video_id === selectedVideo.id)
                        ? "bg-slate-200 text-slate-700 shadow-slate-100"
                        : "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700"
                    )}
                    aria-label={savedVideos.some(v => v.video_id === selectedVideo.id) ? "Remove from saved" : "Save for later"}
                  >
                    <Bookmark size={18} fill={savedVideos.some(v => v.video_id === selectedVideo.id) ? "currentColor" : "none"} />
                    {savedVideos.some(v => v.video_id === selectedVideo.id) ? 'Saved' : 'Save for Later'}
                  </motion.button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {activeTab === 'dashboard' && (
                <>
                  {/* AI Recommendations */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-blue-600" size={24} />
                        <h2 className="text-xl font-black tracking-tight">AI Recommended for You</h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommendations.length > 0 ? recommendations.map((video) => (
                        <motion.div 
                          key={video.id}
                          whileHover={{ y: -8, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "rounded-3xl overflow-hidden border transition-all cursor-pointer group",
                            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-md hover:shadow-xl"
                          )}
                          onClick={() => setSelectedVideo(video)}
                        >
                          <div className="aspect-video relative overflow-hidden">
                            <img 
                              src={video.thumbnail} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                              alt={`Thumbnail for ${video.title}`}
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-2xl transform scale-90 group-hover:scale-100 transition-transform">
                                <Play size={28} fill="currentColor" />
                              </div>
                            </div>
                            <div className="absolute top-4 left-4 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                              {video.topic}
                            </div>
                          </div>
                          <div className="p-5">
                            <h3 className="font-black text-base line-clamp-2 leading-snug mb-3 group-hover:text-blue-600 transition-colors">{video.title}</h3>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                {video.channel[0]}
                              </div>
                              <p className="text-xs text-slate-500 font-bold">{video.channel}</p>
                            </div>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="col-span-full py-12 text-center bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200">
                          <p className="text-slate-400 font-medium">Personalizing your study path...</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Continue Watching */}
                  {history.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-6">
                        <Clock className="text-blue-600" size={24} />
                        <h2 className="text-xl font-black tracking-tight">Continue Watching</h2>
                      </div>
                      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {history.slice(0, 5).map((item) => (
                          <div 
                            key={item.id}
                            className={cn(
                              "min-w-[300px] rounded-2xl overflow-hidden border transition-all cursor-pointer",
                              isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                            )}
                            onClick={() => setSelectedVideo({ id: item.video_id, title: item.video_title })}
                          >
                            <div className="p-4">
                              <h3 className="font-bold text-sm line-clamp-1 mb-2">{item.video_title}</h3>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: '60%' }} />
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Last watched: {new Date(item.last_watched_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}

              {activeTab === 'search' && (
                <section>
                  <h2 className="text-xl font-black tracking-tight mb-6">Search Results</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                      <motion.div 
                        key={video.id}
                        whileHover={{ y: -4 }}
                        className={cn(
                          "rounded-2xl overflow-hidden border transition-all cursor-pointer group",
                          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                        )}
                        onClick={() => setSelectedVideo(video)}
                      >
                        <div className="aspect-video relative overflow-hidden">
                          <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={video.title} />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-xl">
                              <Play size={24} fill="currentColor" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-sm line-clamp-2 leading-tight mb-2">{video.title}</h3>
                          <p className="text-xs text-slate-500 font-medium">{video.channel}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'history' && (
                <section className="max-w-4xl">
                  <h2 className="text-2xl font-black tracking-tight mb-8">Your Study History</h2>
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div 
                        key={item.id}
                        className={cn(
                          "p-4 rounded-2xl border flex items-center justify-between group cursor-pointer transition-all",
                          isDarkMode ? "bg-slate-900 border-slate-800 hover:border-blue-500" : "bg-white border-slate-100 hover:border-blue-200 shadow-sm"
                        )}
                        onClick={() => setSelectedVideo({ id: item.video_id, title: item.video_title })}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Play size={20} fill="currentColor" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">{item.video_title}</h3>
                            <p className="text-xs text-slate-400 font-medium">Watched {item.watch_time}s • {new Date(item.last_watched_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 text-blue-600 font-bold text-xs uppercase tracking-widest transition-opacity">Resume</button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'saved' && (
                <section>
                  <h2 className="text-2xl font-black tracking-tight mb-8">Saved for Later</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedVideos.length > 0 ? savedVideos.map((video) => (
                      <motion.div 
                        key={video.video_id}
                        whileHover={{ y: -4 }}
                        className={cn(
                          "rounded-2xl overflow-hidden border transition-all cursor-pointer group",
                          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                        )}
                        onClick={() => setSelectedVideo({ id: video.video_id, title: video.title, thumbnail: video.thumbnail, channel: video.channel })}
                      >
                        <div className="aspect-video relative overflow-hidden">
                          <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={video.title} />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-xl">
                              <Play size={24} fill="currentColor" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-sm line-clamp-2 leading-tight mb-2">{video.title}</h3>
                          <p className="text-xs text-slate-500 font-medium">{video.channel}</p>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="col-span-full py-20 text-center">
                        <Bookmark className="mx-auto text-slate-200 mb-4" size={48} />
                        <p className="text-slate-400 font-bold">No saved videos yet.</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'analytics' && (
                <section className="max-w-4xl">
                  <h2 className="text-2xl font-black tracking-tight mb-8">Study Analytics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className={cn("p-6 rounded-3xl border", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Lectures</p>
                      <p className="text-3xl font-black">{history.length}</p>
                    </div>
                    <div className={cn("p-6 rounded-3xl border", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Study Time</p>
                      <p className="text-3xl font-black">{Math.floor(history.reduce((acc, curr) => acc + (curr.watch_time || 0), 0) / 60)}m</p>
                    </div>
                    <div className={cn("p-6 rounded-3xl border", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Consistency</p>
                      <p className="text-3xl font-black">85%</p>
                    </div>
                  </div>
                  
                  <div className={cn("p-8 rounded-3xl border", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                    <h3 className="font-bold mb-6">Weekly Progress</h3>
                    <div className="flex items-end justify-between h-48 gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                        <div key={day} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="w-full bg-blue-600 rounded-t-lg transition-all duration-500" 
                            style={{ height: `${[40, 70, 45, 90, 65, 30, 50][i]}%` }} 
                          />
                          <span className="text-[10px] font-bold text-slate-400">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'planner' && (
                <section className="max-w-4xl">
                  <h2 className="text-2xl font-black tracking-tight mb-8">Study Planner</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className={cn("p-8 rounded-3xl border", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                      <h3 className="font-bold mb-6 flex items-center gap-2">
                        <Calendar className="text-blue-600" size={20} />
                        Today's Schedule
                      </h3>
                      <div className="space-y-4">
                        {[
                          { time: '09:00 AM', task: 'Physics: Thermodynamics', status: 'completed' },
                          { time: '11:30 AM', task: 'Maths: Integration', status: 'pending' },
                          { time: '04:00 PM', task: 'Chemistry: Organic', status: 'pending' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                            <span className="text-xs font-bold text-slate-400 w-16">{item.time}</span>
                            <div className={cn("flex-1 p-3 rounded-xl font-bold text-sm", item.status === 'completed' ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-700")}>
                              {item.task}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className={cn("p-8 rounded-3xl border", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm")}>
                      <h3 className="font-bold mb-6 flex items-center gap-2">
                        <Target className="text-blue-600" size={20} />
                        Weekly Goals
                      </h3>
                      <div className="space-y-6">
                        {[
                          { goal: 'Complete 10 Physics Lectures', progress: 70 },
                          { goal: 'Solve 50 Maths Problems', progress: 40 },
                          { goal: 'Revise Chemistry Notes', progress: 100 },
                        ].map((item, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-sm font-bold mb-2">
                              <span>{item.goal}</span>
                              <span className="text-blue-600">{item.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${item.progress}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
