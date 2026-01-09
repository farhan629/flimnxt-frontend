import { useEffect, useState } from "react";
import { supabase } from "../services/superbaseClient";

export default function Vote() {
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 📊 Fetch leaderboard
  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select("id, name, votes, image_url")
      .order("votes", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setCandidates(data);
    setLoading(false);
  };

  // ⚡ Realtime updates
  useEffect(() => {
    fetchCandidates();

    const channel = supabase
      .channel("live-votes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "candidates",
        },
        (payload) => {
          setCandidates((prev) =>
            prev
              .map((c) =>
                c.id === payload.new.id ? payload.new : c
              )
              .sort((a, b) => b.votes - a.votes)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🚀 Instant vote
  const castVote = async () => {
    if (!selectedId) {
      alert("Please select a candidate");
      return;
    }

    // Optimistic UI update
    setCandidates((prev) =>
      prev
        .map((c) =>
          c.id === selectedId
            ? { ...c, votes: c.votes + 1 }
            : c
        )
        .sort((a, b) => b.votes - a.votes)
    );

    await supabase.rpc("increment_vote", {
      candidate_id: selectedId,
    });

    setSelectedId(null);
  };

  // 🧮 Total votes (for percentage)
  const totalVotes = candidates.reduce(
    (sum, c) => sum + c.votes,
    0
  );

  return (
    <div className="container">
      <h1>⚡ Live Voting Leaderboard</h1>

      {loading && <p className="loader">Loading results…</p>}

      {!loading &&
        candidates.map((c, index) => {
          const percent =
            totalVotes > 0
              ? ((c.votes / totalVotes) * 100).toFixed(2)
              : "0.00";

          return (
            <label key={c.id} className="option">
              <input
                type="radio"
                name="vote"
                checked={selectedId === c.id}
                onChange={() => setSelectedId(c.id)}
              />

              {/* Avatar */}
              {c.image_url && (
                <img
                  src={c.image_url}
                  alt={c.name}
                  className="avatar"
                />
              )}

              {/* Info */}
              <div className="info">
                <strong>#{index + 1}</strong>
                <span className="name">{c.name}</span>

                <div className="percentage-text">
                  {percent}%{" "}
                  <small>
                    ({c.votes.toLocaleString()} votes)
                  </small>
                </div>

                {/* Progress bar */}
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </label>
          );
        })}

      <button onClick={castVote}>VOTE</button>
    </div>
  );
}
