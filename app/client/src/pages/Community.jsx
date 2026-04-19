import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const RADIUS_KM = 6371;

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RADIUS_KM * c * 1000;
}

function formatDistance(meters) {
  if (meters === null || meters === undefined) return "Unknown distance";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function getRelevancyScore(post, query) {
  if (!query) return 0;
  const lowerQuery = query.toLowerCase();
  const fields = [post.title || "", post.content || "", post.activity || ""];
  return fields.reduce(
    (score, field) => score + (field.toLowerCase().includes(lowerQuery) ? 1 : 0),
    0
  );
}

function getExcerpt(text) {
  if (!text) return "";
  return text.length > 140 ? `${text.slice(0, 140)}...` : text;
}

export default function CommunityPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState("recency");
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await api.get("/posts");
        setPosts(response.data || []);
      } catch (err) {
        console.error("Error loading community posts:", err);
        setError("Could not load community posts.");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("ready");
      },
      () => {
        setLocationStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const enriched = posts.map((post) => {
      const score = getRelevancyScore(post, normalizedQuery);
      const distance =
        location && post.location?.coordinates?.length === 2
          ? getDistanceInMeters(
              location.latitude,
              location.longitude,
              post.location.coordinates[1],
              post.location.coordinates[0]
            )
          : null;
      return { post, score, distance };
    });

    const visible = normalizedQuery
      ? enriched.filter((item) => item.score > 0)
      : enriched;

    visible.sort((a, b) => {
      if (sortMode === "recency") {
        return new Date(b.post.createdAt) - new Date(a.post.createdAt);
      }

      if (sortMode === "relevancy") {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.post.createdAt) - new Date(a.post.createdAt);
      }

      if (sortMode === "distance") {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      }

      return 0;
    });

    return visible;
  }, [posts, query, sortMode, location]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Community Feed</h1>
            <p className="mt-2 text-slate-600 max-w-2xl">
              Browse created posts from the community. Use relevancy search, then sort by recency, relevancy, or distance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/posts/create")}
            className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-3 text-white shadow-lg transition hover:bg-emerald-700"
          >
            Create New Post
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.5fr_auto]">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Search by relevancy</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, descriptions, activities..."
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Sort posts</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="recency">Recency</option>
              <option value="relevancy">Relevancy</option>
              <option value="distance">Distance</option>
            </select>
          </label>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                {locationStatus === "ready"
                  ? "Distance sort uses your current location."
                  : locationStatus === "denied"
                  ? "Location permission denied; distance sorting will show unknown distances."
                  : locationStatus === "unsupported"
                  ? "Location unavailable in this browser."
                  : "Finding your location..."}
              </p>
            </div>
            <div className="text-sm text-slate-500">
              {query && filteredPosts.length === 0
                ? `No posts match “${query}”.`
                : `${filteredPosts.length} post${filteredPosts.length === 1 ? "" : "s"} displayed.`}
            </div>
          </div>

          {loading ? (
            <div className="flex h-72 items-center justify-center text-slate-500">
              Loading community posts...
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-rose-50 p-6 text-rose-700">
              {error}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              No posts found. Try clearing the search or adjusting the sort mode.
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto px-1 py-2 max-h-[70vh]">
              {filteredPosts.map(({ post, score, distance }) => (
                <article
                  key={post._id}
                  className="group rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{post.activity || "General"}</span>
                        <span>•</span>
                        <span>{post.visibility}</span>
                      </div>
                      <h2 className="text-2xl font-semibold text-slate-900">{post.title}</h2>
                      <p className="max-w-2xl leading-7 text-slate-700">{getExcerpt(post.content)}</p>
                    </div>
                    <div className="flex min-w-[160px] flex-col gap-3 text-sm text-slate-600">
                      {distance !== null && (
                        <span className="rounded-2xl bg-emerald-100 px-3 py-1 text-emerald-700">
                          {formatDistance(distance)} away
                        </span>
                      )}
                      {query && (
                        <span className="rounded-2xl bg-slate-100 px-3 py-1">
                          Relevance score: {score}
                        </span>
                      )}
                      <span className="rounded-2xl bg-slate-100 px-3 py-1">
                        {post.likes || 0} like{post.likes === 1 ? "" : "s"}
                      </span>
                      <span className="rounded-2xl bg-slate-100 px-3 py-1">
                        {post.location?.coordinates?.length === 2
                          ? `Location: ${post.location.coordinates[1].toFixed(2)}, ${post.location.coordinates[0].toFixed(2)}`
                          : "Location n/a"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/posts/${post._id}`)}
                      className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      View post
                    </button>
                    <span className="text-sm text-slate-500">
                      {post.activity ? `Activity: ${post.activity}` : "No activity tag"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
