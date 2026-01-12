import { useEffect, useRef } from "react";

export default function Fireworks({ show }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!show) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];

    function random(min, max) {
      return Math.random() * (max - min) + min;
    }

    function createFirework() {
      const x = random(100, canvas.width - 100);
      const y = random(50, canvas.height / 2);

      const count = 60;
      const colors = ["#ff005c", "#ffd700", "#9b00ff", "#00eaff"];

      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          vx: random(-4, 4),
          vy: random(-4, 4),
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.015;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();

        if (p.alpha <= 0) particles.splice(i, 1);
      });

      requestAnimationFrame(animate);
    }

    // launch multiple fireworks
    for (let i = 0; i < 6; i++) {
      setTimeout(createFirework, i * 400);
    }

    animate();

    return () => {
      particles = [];
    };
  }, [show]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none"
      }}
    />
  );
}
