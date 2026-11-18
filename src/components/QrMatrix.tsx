import React from 'react';

interface QrMatrixProps {
  value: string;
  size?: number;
}

export const QrMatrix: React.FC<QrMatrixProps> = ({ value, size = 148 }) => {
  const grid = 21;
  const cells: boolean[][] = Array.from({ length: grid }, () => Array(grid).fill(false));

  const drawFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[startR + r][startC + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, grid - 7);
  drawFinder(grid - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= grid - 8;
      const inBottomLeft = r >= grid - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      if (r === 6 || c === 6) {
        cells[r][c] = (r + c) % 2 === 0;
        continue;
      }

      const seed = (hash ^ ((r + 1) * 73856093) ^ ((c + 1) * 19349663)) >>> 0;
      cells[r][c] = seed % 100 < 48;
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${grid + 2} ${grid + 2}`}
      role="img"
      aria-label={`Купон QR код: ${value}`}
      className="rounded-xl border border-slate-200 bg-white p-1.5"
    >
      <rect x="0" y="0" width={grid + 2} height={grid + 2} fill="#ffffff" />
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect key={`${r}-${c}`} x={c + 1} y={r + 1} width="1" height="1" fill="#0f172a" />
          ) : null
        )
      )}
    </svg>
  );
};
