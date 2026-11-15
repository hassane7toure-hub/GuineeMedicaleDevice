export function DeviceArt({ category }: { category: string }) {
  const tone = category === "imagerie" ? "#0c3b64" : category === "laboratoire" || category === "reactifs-laboratoire" ? "#1b7a4e" : "#0c3b64";
  if (category === "reactifs-laboratoire") {
    return (
      <svg viewBox="0 0 320 240" role="img" aria-hidden="true" className="h-full w-full">
        <rect width="320" height="240" fill="#f7fbfb" />
        <g fill="none" stroke={tone} strokeWidth="3">
          <path d="M118 52h28v46l-16 28v42h-12V126l-16-28V52h16z" />
          <path d="M154 64h28v34l-16 28v42h-12V126l-16-28V64h16z" />
          <path d="M190 52h28v46l-16 28v42h-12V126l-16-28V52h16z" />
          <path d="M122 78h20" stroke="#2fa86c" />
          <path d="M158 90h20" stroke="#e03e3e" />
          <path d="M194 78h20" stroke="#0c3b64" />
        </g>
        <text x="160" y="214" textAnchor="middle" fill="#5c6b76" fontSize="13" fontFamily="Segoe UI, sans-serif">
          Illustration
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 320 240" role="img" aria-hidden="true" className="h-full w-full">
      <rect width="320" height="240" fill="#f7fbfb" />
      <g fill="none" stroke={tone} strokeWidth="3">
        <rect x="78" y="48" width="164" height="120" rx="12" />
        <path d="M108 108h104" stroke="#2fa86c" />
        <path d="M150 78v60" stroke="#e03e3e" />
        <rect x="118" y="168" width="84" height="14" rx="4" />
      </g>
      <text x="160" y="214" textAnchor="middle" fill="#5c6b76" fontSize="13" fontFamily="Segoe UI, sans-serif">
        Illustration
      </text>
    </svg>
  );
}
