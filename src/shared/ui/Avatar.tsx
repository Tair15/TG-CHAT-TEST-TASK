export default function Avatar({ title, size = 40 }: { title: string; size?: number }) {
  const str = String(title || '?');
  const letter = str.replace(/^[@+]/, '')[0]?.toUpperCase() || '?';
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {letter}
    </div>
  );
}
