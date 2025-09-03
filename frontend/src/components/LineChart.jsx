import React from "react";
import { motion } from "framer-motion";

const LineChart = ({ data, metrics = {} }) => {
  const width = 900, height = 260, pad = 40;
  const points = data.labels.length || 1;
  const whatsapp = [...(data.whatsapp || [])];
  const linkedin = [...(data.linkedin || [])];
  const instagram = [...(data.instagram || [])];
  const website = [...(data.website || [])];
  if (points > 0) {
    whatsapp[points - 1] = Number.isFinite(metrics.whatsapp) ? metrics.whatsapp : whatsapp[points - 1];
    linkedin[points - 1] = Number.isFinite(metrics.linkedin) ? metrics.linkedin : linkedin[points - 1];
    instagram[points - 1] = Number.isFinite(metrics.instagram) ? metrics.instagram : instagram[points - 1];
    website[points - 1] = Number.isFinite(metrics.website) ? metrics.website : website[points - 1];
  }
  const all = [...whatsapp, ...linkedin, ...instagram, ...website];
  const max = Math.max(...all) || 1;
  const x = i => pad + i * ((width - pad * 2) / Math.max(1, points - 1));
  const y = v => height - pad - (v / max) * (height - pad * 2);
  const pathFor = arr => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

  const transition = { duration: 0.8, ease: "easeInOut" };

  return (
    <div className="rounded-2xl p-6 bg-slate-900/60 border border-cyan-500/10">
      <div className="mb-3"><h3 className="text-lg font-bold">Platform Growth Analytics</h3></div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[260px]">
        <defs>
          <linearGradient id="gW"><stop offset="0%" stopColor="#25d366"/><stop offset="100%" stopColor="#075e54"/></linearGradient>
          <linearGradient id="gL"><stop offset="0%" stopColor="#0077b5"/><stop offset="100%" stopColor="#004471"/></linearGradient>
          <linearGradient id="gI"><stop offset="0%" stopColor="#e1306c"/><stop offset="100%" stopColor="#833ab4"/></linearGradient>
          <linearGradient id="gWeb"><stop offset="0%" stopColor="#ffd600"/><stop offset="100%" stopColor="#ff8c00"/></linearGradient>
        </defs>

        {[0,0.25,0.5,0.75,1].map((t,i) => <line key={i} x1={pad} x2={width - pad} y1={pad + (height - pad*2)*t} y2={pad + (height - pad*2)*t} stroke="rgba(255,255,255,0.06)"/>)}

        <motion.path d={pathFor(whatsapp)} fill="none" stroke="url(#gW)" strokeWidth={2.5} strokeLinecap="round" transition={transition} animate={{ d: pathFor(whatsapp) }} />
        <motion.path d={pathFor(linkedin)} fill="none" stroke="url(#gL)" strokeWidth={2.5} strokeLinecap="round" transition={transition} animate={{ d: pathFor(linkedin) }} />
        <motion.path d={pathFor(instagram)} fill="none" stroke="url(#gI)" strokeWidth={2.5} strokeLinecap="round" transition={transition} animate={{ d: pathFor(instagram) }} />
        <motion.path d={pathFor(website)} fill="none" stroke="url(#gWeb)" strokeWidth={2.5} strokeLinecap="round" transition={transition} animate={{ d: pathFor(website) }} />

        {data.labels.map((lab,i) => <text key={i} x={x(i)} y={height - 8} fontSize={10} textAnchor="middle" fill="rgba(255,255,255,0.6)">{lab}</text>)}
      </svg>
    </div>
  );
};

export default LineChart;
