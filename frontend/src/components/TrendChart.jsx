import { useEffect, useMemo, useRef, useState } from 'react';

export default function TrendChart({ series = [] }) {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const [hovered, setHovered] = useState(null);
  const populated = useMemo(
    () => series.filter((point) => Number.isFinite(point.average)),
    [series],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !series.length) return undefined;

    const container = canvas.parentElement;
    const draw = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = 270;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const context = canvas.getContext('2d');
      context.scale(ratio, ratio);
      context.clearRect(0, 0, width, height);

      const padding = { top: 20, right: 18, bottom: 43, left: 38 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      context.font = '11px Inter, Segoe UI, sans-serif';
      context.textAlign = 'right';
      context.textBaseline = 'middle';

      [1, 4, 7, 10].forEach((score) => {
        const y = padding.top + chartHeight - ((score - 1) / 9) * chartHeight;
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.strokeStyle = '#e3e8e5';
        context.lineWidth = 1;
        context.stroke();
        context.fillStyle = '#64716d';
        context.fillText(String(score), padding.left - 10, y);
      });

      const step = series.length > 1 ? chartWidth / (series.length - 1) : chartWidth / 2;
      const points = series.map((point, index) => {
        if (!Number.isFinite(point.average)) return null;
        return {
          x: series.length > 1 ? padding.left + index * step : padding.left + chartWidth / 2,
          y: padding.top + chartHeight - ((point.average - 1) / 9) * chartHeight,
          value: point.average,
          label: point.label,
          count: point.count,
        };
      });
      pointsRef.current = points.filter(Boolean);

      context.beginPath();
      let drawing = false;
      points.forEach((point) => {
        if (!point) return;
        if (!drawing) {
          context.moveTo(point.x, point.y);
          drawing = true;
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.strokeStyle = '#247565';
      context.lineWidth = 3;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      context.stroke();

      points.filter(Boolean).forEach((point) => {
        context.beginPath();
        context.arc(point.x, point.y, 5, 0, Math.PI * 2);
        context.fillStyle = '#f7a45e';
        context.fill();
        context.lineWidth = 3;
        context.strokeStyle = '#fff';
        context.stroke();
      });

      context.textAlign = 'center';
      context.textBaseline = 'top';
      context.fillStyle = '#64716d';
      const labelEvery = Math.max(1, Math.ceil(series.length / (width < 520 ? 4 : 7)));
      series.forEach((point, index) => {
        if (index % labelEvery !== 0 && index !== series.length - 1) return;
        const x = series.length > 1 ? padding.left + index * step : padding.left + chartWidth / 2;
        context.fillText(point.label, x, height - padding.bottom + 14);
      });
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [series]);

  const handlePointerMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const nearest = pointsRef.current.reduce((best, point) => {
      const distance = Math.hypot(point.x - x, point.y - y);
      return !best || distance < best.distance ? { ...point, distance } : best;
    }, null);
    setHovered(nearest && nearest.distance < 28 ? nearest : null);
  };

  if (!populated.length) {
    return (
      <div className="grid h-[270px] place-items-center rounded-2xl border border-pine-100 bg-pine-50/60 px-6 text-center">
        <div>
          <p className="font-semibold text-pine-950">Your chart is ready for its first point</p>
          <p className="mt-1 text-sm text-slate-500">Log a mood to begin seeing your emotional pattern.</p>
        </div>
      </div>
    );
  }

  const summary = populated.map((point) => `${point.label}: ${point.average} out of 10`).join(', ');

  return (
    <div className="relative w-full overflow-hidden" role="img" aria-label={`Mood trend. ${summary}`}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHovered(null)}
        className="cursor-crosshair"
      />
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 min-w-28 -translate-x-1/2 -translate-y-full rounded-lg bg-pine-950 px-3 py-2 text-center text-white shadow-lg"
          style={{ left: hovered.x, top: hovered.y - 10 }}
        >
          <p className="text-xs font-semibold text-pine-200">{hovered.label}</p>
          <p className="mt-0.5 text-sm font-semibold">{hovered.value}/10</p>
          {hovered.count ? <p className="text-xs text-pine-100/55">{hovered.count} check-in{hovered.count === 1 ? '' : 's'}</p> : null}
        </div>
      )}
    </div>
  );
}
