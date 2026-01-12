import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import confetti from "canvas-confetti";

const VOTE_END_TIME = new Date("2026-01-16T12:00:00").getTime();

export default function Vote() {
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [winner, setWinner] = useState(null);

  /* ================= FETCH ================= */
  const fetchCandidates = async () => {
    const { data } = await supabase
      .from("candidates")
      .select("id, name, votes, image_url")
      .order("votes", { ascending: false });

    if (data) {
      setCandidates(data);
      setWinner(data[0]);
      setLoading(false);
    }
  };

  /* ================= REALTIME ================= */
  useEffect(() => {
    fetchCandidates();

    const channel = supabase
      .channel("votes-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "candidates" },
        () => fetchCandidates()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  /* ================= TIMER ================= */
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = VOTE_END_TIME - Date.now();

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft("Voting Ended");
        setWinner(candidates[0]);
        confetti({ particleCount: 200, spread: 120 });
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [candidates]);

  /* ================= VOTE ================= */
  const castVote = async () => {
    if (!selectedId) return alert("Select a candidate");

    setVoted(true);

    // 🎉 Confetti burst
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });

    // Optimistic UI
    setCandidates((prev) =>
      prev
        .map((c) =>
          c.id === selectedId ? { ...c, votes: c.votes + 1 } : c
        )
        .sort((a, b) => b.votes - a.votes)
    );

    await supabase.rpc("increment_vote", {
      candidate_id: selectedId,
    });

    setSelectedId(null);
  };

  /* ================= PERCENT ================= */
  const totalVotes = candidates.reduce((s, c) => s + c.votes, 0);
  const percent = (v) =>
    totalVotes ? ((v / totalVotes) * 100).toFixed(2) : "0.00";

  if (loading) return <p className="loader">Loading…</p>;

  return (
    <div className="container">
      <h1>🔥 Bigg Boss Tamil – Final Week Voting</h1>
      <p className="timer">⏳ Voting ends in: {timeLeft}</p>

      <div className="finale-layout">
        {/* LEFT */}
        <div className="vote-panel">
          {candidates.map((c, i) => (
            <label key={c.id} className="option">
              <input
                type="radio"
                name="vote"
                checked={selectedId === c.id}
                onChange={() => setSelectedId(c.id)}
              />

              <img src={c.image_url} className="avatar" />

              <div className="info">
                <strong>#{i + 1}</strong>
                <span className="name">{c.name}</span>

                <div className="percentage-text">
                  {percent(c.votes)}% ({c.votes} votes)
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${percent(c.votes)}%` }}
                  />
                </div>
              </div>
            </label>
          ))}

          <button onClick={castVote}>VOTE</button>

          {voted && (
            <div className="success">
              🎉 Your vote has been counted!
            </div>
          )}
        </div>

        {/* RIGHT */}
        {winner && (
          <div className="winner-side">
            <div className="winner-card">
              <span className="crown">👑</span>
              <img src={winner.image_url} />
              <h3>{winner.name}</h3>
              <p>Leading Candidate</p>
              <button className="cheer-btn">🎉 Cheer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
