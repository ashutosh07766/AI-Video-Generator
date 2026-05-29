export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="mask-fade-x overflow-hidden py-2">
      <div className="flex w-max animate-marquee gap-3">
        {row.map((x, i) => (
          <span key={i} className="pill whitespace-nowrap text-white/70">
            {x}
          </span>
        ))}
      </div>
    </div>
  );
}
