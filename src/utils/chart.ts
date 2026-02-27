import chalk from 'chalk';

export interface ChartOptions {
  title: string;
  width?: number;
  height?: number;
  yLabel?: string;
  xLabel?: string;
  yFormat?: (v: number) => string;
  color?: (s: string) => string;
}

export function renderLineChart(data: number[], options: ChartOptions): string {
  const {
    title,
    width = 50,
    height = 12,
    yLabel = '',
    xLabel = '',
    yFormat = (v: number) => v.toFixed(1),
    color = (s: string) => chalk.green(s),
  } = options;

  if (data.length === 0) return '';

  const max = Math.max(...data);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const lines: string[] = [];

  lines.push('');
  lines.push('  ' + chalk.bold(title));
  if (yLabel) lines.push('  ' + chalk.gray(yLabel));
  lines.push('');

  // Build chart grid
  for (let row = height; row >= 0; row--) {
    const yVal = min + (row / height) * range;
    const yStr = yFormat(yVal).padStart(7);
    let line = chalk.gray(yStr) + ' ' + chalk.gray('│');

    const step = Math.max(1, Math.floor(data.length / width));
    for (let col = 0; col < Math.min(data.length, width); col++) {
      const idx = Math.min(col * step, data.length - 1);
      const normalized = ((data[idx] - min) / range) * height;
      if (Math.abs(Math.round(normalized) - row) === 0) {
        line += color('●');
      } else if (row === 0) {
        line += chalk.gray('─');
      } else {
        line += ' ';
      }
    }
    lines.push(line);
  }

  // X axis
  const chartWidth = Math.min(data.length, width);
  lines.push('        ' + chalk.gray('└') + chalk.gray('─'.repeat(chartWidth)));
  if (xLabel) {
    lines.push('         ' + chalk.gray(xLabel));
  }
  // X axis labels (first, middle, last)
  if (data.length > 1) {
    const labelLine = '         ' +
      chalk.gray('1') +
      ' '.repeat(Math.max(0, Math.floor(chartWidth / 2) - 2)) +
      chalk.gray(String(Math.ceil(data.length / 2))) +
      ' '.repeat(Math.max(0, chartWidth - Math.floor(chartWidth / 2) - String(data.length).length - 1)) +
      chalk.gray(String(data.length));
    lines.push(labelLine);
  }

  return lines.join('\n');
}

export function renderDualChart(
  data1: number[],
  data2: number[],
  options: {
    title: string;
    label1: string;
    label2: string;
    yFormat?: (v: number) => string;
    width?: number;
    height?: number;
  },
): string {
  const { title, label1, label2, yFormat = (v) => v.toFixed(1), width = 50, height = 12 } = options;

  const allData = [...data1, ...data2];
  const max = Math.max(...allData);
  const min = Math.min(...allData, 0);
  const range = max - min || 1;
  const lines: string[] = [];

  lines.push('');
  lines.push('  ' + chalk.bold(title));
  lines.push('  ' + chalk.green('●') + ' ' + chalk.gray(label1) + '   ' + chalk.cyan('◆') + ' ' + chalk.gray(label2));
  lines.push('');

  for (let row = height; row >= 0; row--) {
    const yVal = min + (row / height) * range;
    const yStr = yFormat(yVal).padStart(7);
    let line = chalk.gray(yStr) + ' ' + chalk.gray('│');

    const step = Math.max(1, Math.floor(Math.max(data1.length, data2.length) / width));
    const len = Math.min(Math.max(data1.length, data2.length), width);
    for (let col = 0; col < len; col++) {
      const idx = Math.min(col * step, Math.max(data1.length, data2.length) - 1);
      const n1 = idx < data1.length ? ((data1[idx] - min) / range) * height : -1;
      const n2 = idx < data2.length ? ((data2[idx] - min) / range) * height : -1;
      const hit1 = Math.abs(Math.round(n1) - row) === 0;
      const hit2 = Math.abs(Math.round(n2) - row) === 0;

      if (hit1 && hit2) line += chalk.yellow('◎');
      else if (hit1) line += chalk.green('●');
      else if (hit2) line += chalk.cyan('◆');
      else if (row === 0) line += chalk.gray('─');
      else line += ' ';
    }
    lines.push(line);
  }

  const chartWidth = Math.min(Math.max(data1.length, data2.length), width);
  lines.push('        ' + chalk.gray('└') + chalk.gray('─'.repeat(chartWidth)));

  return lines.join('\n');
}

export function renderTable(headers: string[], rows: string[][]): string {
  // Calculate column widths
  const widths = headers.map((h, i) => {
    const colValues = rows.map(r => (r[i] || '').length);
    return Math.max(h.length, ...colValues) + 2;
  });

  const lines: string[] = [];
  const totalWidth = widths.reduce((s, w) => s + w + 1, 1);

  // Top border
  lines.push('  ' + chalk.gray('┌' + widths.map(w => '─'.repeat(w)).join('┬') + '┐'));

  // Header
  const headerLine = widths.map((w, i) => {
    const text = headers[i] || '';
    const pad = w - text.length;
    const left = Math.floor(pad / 2);
    const right = pad - left;
    return ' '.repeat(left) + chalk.bold(text) + ' '.repeat(right);
  }).join(chalk.gray('│'));
  lines.push('  ' + chalk.gray('│') + headerLine + chalk.gray('│'));

  // Header separator
  lines.push('  ' + chalk.gray('├' + widths.map(w => '─'.repeat(w)).join('┼') + '┤'));

  // Data rows
  for (const row of rows) {
    const rowLine = widths.map((w, i) => {
      const text = row[i] || '';
      const pad = w - text.length;
      const left = Math.floor(pad / 2);
      const right = pad - left;
      return ' '.repeat(left) + text + ' '.repeat(right);
    }).join(chalk.gray('│'));
    lines.push('  ' + chalk.gray('│') + rowLine + chalk.gray('│'));
  }

  // Bottom border
  lines.push('  ' + chalk.gray('└' + widths.map(w => '─'.repeat(w)).join('┴') + '┘'));

  return lines.join('\n');
}

export function renderBox(title: string, lines: string[]): string {
  const maxLen = Math.max(title.length, ...lines.map(l => l.length)) + 4;
  const output: string[] = [];

  output.push('  ' + chalk.hex('#00d4ff')('╔' + '═'.repeat(maxLen) + '╗'));
  const titlePad = maxLen - title.length;
  const tl = Math.floor(titlePad / 2);
  const tr = titlePad - tl;
  output.push('  ' + chalk.hex('#00d4ff')('║') + ' '.repeat(tl) + chalk.bold(title) + ' '.repeat(tr) + chalk.hex('#00d4ff')('║'));
  output.push('  ' + chalk.hex('#00d4ff')('╚' + '═'.repeat(maxLen) + '╝'));

  for (const line of lines) {
    output.push('  ' + line);
  }

  return output.join('\n');
}
