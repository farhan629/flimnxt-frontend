import Vote from "./Vote";
import banner from "../assets/Bigg_Boss_Tamil_Poster.jpg";

export default function Home() {
  return (
    <div className="page">
      {/* HERO SECTION */}
      <section className="hero">
        <img src={banner} alt="Bigg Boss Tamil" />
        <div className="hero-text">
          <h1>Bigg Boss Tamil</h1>
          <p>Vote for Your Favourite Contestant</p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="content">
        <Vote />
      </section>
    </div>
  );
}
