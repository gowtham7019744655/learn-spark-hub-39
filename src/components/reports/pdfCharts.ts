import jsPDF from 'jspdf';

interface BarChartData {
  label: string;
  value: number;
  color?: [number, number, number];
}

interface PieChartData {
  label: string;
  value: number;
  color: [number, number, number];
}

const DEFAULT_COLORS: [number, number, number][] = [
  [14, 116, 144],   // teal
  [59, 130, 246],   // blue
  [16, 185, 129],   // green
  [245, 158, 11],   // amber
  [239, 68, 68],    // red
  [139, 92, 246],   // purple
  [236, 72, 153],   // pink
  [20, 184, 166],   // cyan
];

/**
 * Draw a bar chart directly onto a jsPDF document.
 */
export const drawBarChart = (
  doc: jsPDF,
  data: BarChartData[],
  x: number,
  y: number,
  width: number,
  height: number,
  title?: string,
) => {
  const chartPadding = { top: title ? 18 : 6, bottom: 28, left: 30, right: 10 };
  const chartX = x + chartPadding.left;
  const chartY = y + chartPadding.top;
  const chartW = width - chartPadding.left - chartPadding.right;
  const chartH = height - chartPadding.top - chartPadding.bottom;

  // Title
  if (title) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(title, x + width / 2, y + 12, { align: 'center' });
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const gridLines = 5;

  // Grid lines & Y-axis labels
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);

  for (let i = 0; i <= gridLines; i++) {
    const lineY = chartY + chartH - (i / gridLines) * chartH;
    doc.line(chartX, lineY, chartX + chartW, lineY);
    const label = Math.round((i / gridLines) * maxVal).toString();
    doc.text(label, chartX - 3, lineY + 1.5, { align: 'right' });
  }

  // Bars
  const barGap = 4;
  const totalGaps = (data.length + 1) * barGap;
  const barWidth = Math.min((chartW - totalGaps) / data.length, 24);
  const startX = chartX + (chartW - data.length * barWidth - (data.length - 1) * barGap) / 2;

  data.forEach((item, i) => {
    const barH = (item.value / maxVal) * chartH;
    const bx = startX + i * (barWidth + barGap);
    const by = chartY + chartH - barH;
    const color = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];

    // Bar shadow
    doc.setFillColor(color[0], color[1], color[2]);
    doc.setGState(doc.GState({ opacity: 0.15 }));
    doc.roundedRect(bx + 1, by + 1, barWidth, barH, 1.5, 1.5, 'F');

    // Bar fill
    doc.setGState(doc.GState({ opacity: 1 }));
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(bx, by, barWidth, barH, 1.5, 1.5, 'F');

    // Value label on top
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(item.value.toString(), bx + barWidth / 2, by - 2, { align: 'center' });

    // X-axis label
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const labelText = item.label.length > 10 ? item.label.substring(0, 9) + '…' : item.label;
    doc.text(labelText, bx + barWidth / 2, chartY + chartH + 8, { align: 'center', maxWidth: barWidth + barGap });
  });

  doc.setTextColor(0, 0, 0);
};

/**
 * Draw a pie chart directly onto a jsPDF document.
 */
export const drawPieChart = (
  doc: jsPDF,
  data: PieChartData[],
  centerX: number,
  centerY: number,
  radius: number,
  title?: string,
) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return;

  // Title
  if (title) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(title, centerX, centerY - radius - 8, { align: 'center' });
  }

  let startAngle = -Math.PI / 2; // Start from top

  // First pass: draw all slices
  const slices: { midAngle: number; pct: number; color: [number, number, number]; label: string }[] = [];
  let angle = startAngle;
  data.forEach((item) => {
    if (item.value === 0) return;
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const endAngle = angle + sliceAngle;

    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    const steps = Math.max(Math.ceil(sliceAngle / 0.05), 8);
    const angleStep = sliceAngle / steps;

    for (let s = 0; s < steps; s++) {
      const a1 = angle + s * angleStep;
      const a2 = angle + (s + 1) * angleStep;
      const x1 = centerX + radius * Math.cos(a1);
      const y1 = centerY + radius * Math.sin(a1);
      const x2 = centerX + radius * Math.cos(a2);
      const y2 = centerY + radius * Math.sin(a2);
      doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');
    }

    const pct = Math.round((item.value / total) * 100);
    if (pct >= 3) {
      slices.push({ midAngle: angle + sliceAngle / 2, pct, color: item.color, label: item.label });
    }
    angle = endAngle;
  });

  // Second pass: place labels with collision avoidance
  const labelRadius = radius + 14;
  const placedLabels: { x: number; y: number }[] = [];
  const MIN_GAP = 8; // minimum vertical gap between labels

  slices.forEach((slice) => {
    let lx = centerX + labelRadius * Math.cos(slice.midAngle);
    let ly = centerY + labelRadius * Math.sin(slice.midAngle);

    // Push labels apart vertically if they overlap
    for (const placed of placedLabels) {
      if (Math.abs(ly - placed.y) < MIN_GAP && Math.abs(lx - placed.x) < 40) {
        ly = ly > placed.y ? placed.y + MIN_GAP : placed.y - MIN_GAP;
      }
    }
    placedLabels.push({ x: lx, y: ly });

    const innerX = centerX + (radius - 2) * Math.cos(slice.midAngle);
    const innerY = centerY + (radius - 2) * Math.sin(slice.midAngle);

    doc.setDrawColor(slice.color[0], slice.color[1], slice.color[2]);
    doc.setLineWidth(0.4);
    doc.line(innerX, innerY, lx, ly);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slice.color[0], slice.color[1], slice.color[2]);
    const align = Math.cos(slice.midAngle) >= 0 ? 'left' : 'right';
    const textX = Math.cos(slice.midAngle) >= 0 ? lx + 3 : lx - 3;
    doc.text(`${slice.label} (${slice.pct}%)`, textX, ly + 1.5, { align });
  });

  doc.setTextColor(0, 0, 0);
};

/**
 * Draw a horizontal stacked bar (e.g., for attendance).
 */
export const drawStackedBar = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  segments: { value: number; color: [number, number, number]; label: string }[],
  title?: string,
) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return;

  if (title) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(title, x, y - 4);
  }

  let currentX = x;
  segments.forEach((seg) => {
    const segWidth = (seg.value / total) * width;
    doc.setFillColor(seg.color[0], seg.color[1], seg.color[2]);
    doc.roundedRect(currentX, y, segWidth, height, 2, 2, 'F');
    currentX += segWidth;
  });

  // Legend below
  let legendX = x;
  const legendY = y + height + 6;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  segments.forEach((seg) => {
    doc.setFillColor(seg.color[0], seg.color[1], seg.color[2]);
    doc.roundedRect(legendX, legendY, 6, 6, 1, 1, 'F');
    doc.setTextColor(80, 80, 80);
    const pct = Math.round((seg.value / total) * 100);
    const text = `${seg.label}: ${seg.value} (${pct}%)`;
    doc.text(text, legendX + 8, legendY + 5);
    legendX += doc.getTextWidth(text) + 16;
  });

  doc.setTextColor(0, 0, 0);
};

/**
 * Draw a line chart directly onto a jsPDF document.
 */
export const drawLineChart = (
  doc: jsPDF,
  data: { label: string; value: number }[],
  x: number,
  y: number,
  width: number,
  height: number,
  title?: string,
  lineColor?: [number, number, number],
) => {
  if (data.length === 0) return;

  const color = lineColor || DEFAULT_COLORS[0];
  const chartPadding = { top: title ? 18 : 6, bottom: 28, left: 30, right: 10 };
  const chartX = x + chartPadding.left;
  const chartY = y + chartPadding.top;
  const chartW = width - chartPadding.left - chartPadding.right;
  const chartH = height - chartPadding.top - chartPadding.bottom;

  // Title
  if (title) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(title, x + width / 2, y + 12, { align: 'center' });
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const gridLines = 5;

  // Grid lines & Y-axis labels
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);

  for (let i = 0; i <= gridLines; i++) {
    const lineY = chartY + chartH - (i / gridLines) * chartH;
    doc.line(chartX, lineY, chartX + chartW, lineY);
    const label = Math.round((i / gridLines) * maxVal).toString();
    doc.text(label, chartX - 3, lineY + 1.5, { align: 'right' });
  }

  // Calculate point positions
  const points = data.map((item, i) => ({
    x: chartX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: chartY + chartH - (item.value / maxVal) * chartH,
    label: item.label,
    value: item.value,
  }));

  // Fill area under line
  doc.setFillColor(color[0], color[1], color[2]);
  doc.setGState(doc.GState({ opacity: 0.08 }));
  const areaPath = [
    { x: points[0].x, y: chartY + chartH },
    ...points.map((p) => ({ x: p.x, y: p.y })),
    { x: points[points.length - 1].x, y: chartY + chartH },
  ];
  for (let i = 0; i < areaPath.length - 2; i++) {
    doc.triangle(areaPath[0].x, areaPath[0].y, areaPath[i + 1].x, areaPath[i + 1].y, areaPath[i + 2].x, areaPath[i + 2].y, 'F');
  }
  doc.setGState(doc.GState({ opacity: 1 }));

  // Draw line segments
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(1.2);
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  }

  // Draw data points
  points.forEach((p) => {
    doc.setFillColor(255, 255, 255);
    doc.circle(p.x, p.y, 2, 'F');
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(p.x, p.y, 1.3, 'F');
  });

  // Value labels above points
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color[0], color[1], color[2]);
  points.forEach((p) => {
    doc.text(p.value.toString(), p.x, p.y - 4, { align: 'center' });
  });

  // X-axis labels
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  points.forEach((p) => {
    const labelText = p.label.length > 10 ? p.label.substring(0, 9) + '…' : p.label;
    doc.text(labelText, p.x, chartY + chartH + 8, { align: 'center' });
  });

  doc.setTextColor(0, 0, 0);
};

export { DEFAULT_COLORS };
