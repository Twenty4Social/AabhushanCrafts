export default function RateChange({ amount, comparisonDate }: { amount?: number | null; comparisonDate?: string | null }) {
  const known = typeof amount === "number" && Number.isFinite(amount);
  const direction = !known || amount === 0 ? "flat" : amount > 0 ? "up" : "down";
  const label = !known ? "Change unavailable" : amount === 0 ? "No change" : `${amount > 0 ? "Up" : "Down"} NPR ${Math.abs(amount).toLocaleString("en-IN")} per tola`;
  const date = comparisonDate ? new Date(comparisonDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kathmandu" }) : "previous published rate";
  return (
    <span className={`rateChange rateChange--${direction}`} title={`${label} · compared with ${date}`} aria-label={`${label}${known ? `, compared with ${date}` : ""}`}>
      <span aria-hidden="true">{direction === "up" ? "↑" : direction === "down" ? "↓" : "—"}</span>
      {!known ? "Unavailable" : amount === 0 ? "No change" : `NPR ${Math.abs(amount).toLocaleString("en-IN")}`}
    </span>
  );
}
