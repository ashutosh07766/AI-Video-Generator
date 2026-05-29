export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className="aurora"
        style={{ width: "42rem", height: "42rem", left: "-12rem", top: "-14rem", background: "radial-gradient(circle, rgba(244,69,42,0.55), transparent 60%)" }}
      />
      <div
        className="aurora"
        style={{ width: "38rem", height: "38rem", right: "-10rem", top: "-8rem", background: "radial-gradient(circle, rgba(255,45,131,0.5), transparent 60%)", animationDelay: "-6s" }}
      />
      <div
        className="aurora"
        style={{ width: "36rem", height: "36rem", left: "28%", top: "8%", background: "radial-gradient(circle, rgba(139,61,240,0.45), transparent 60%)", animationDelay: "-12s" }}
      />
    </div>
  );
}
