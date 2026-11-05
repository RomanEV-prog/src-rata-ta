export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="18" fill="#1a3a6b" />
      <circle cx="18" cy="18" r="13" fill="#e8a020" />
      <circle cx="18" cy="18" r="8.5" fill="#e03030" />
      <circle cx="18" cy="18" r="4" fill="#111" />
      <circle cx="18" cy="18" r="1.5" fill="#fff" />
    </svg>
  );
}
