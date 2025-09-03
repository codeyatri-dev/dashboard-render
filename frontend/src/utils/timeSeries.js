export function generateTimeSeries() {
  const labels = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (11 - i) * 3);
    return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
  });

  const rnd = (base, idx) =>
    Math.max(0, Math.round(base + Math.sin(idx / 2) * 200 + idx * 40));

  return {
    labels,
    whatsapp: labels.map((_, i) => rnd(800, i)),
    instagram: labels.map((_, i) => rnd(6000, i)),
    linkedin: labels.map((_, i) => rnd(2000, i)),
    googleVisits: labels.map((_, i) => rnd(1500, i)),
    websiteVisits: labels.map((_, i) => rnd(12000, i)),
  };
}
