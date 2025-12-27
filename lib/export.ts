import { Platform } from 'react-native';

// Lazy load native modules only when needed (using legacy API for compatibility)
let FileSystem: typeof import('expo-file-system/legacy') | null = null;
let Sharing: typeof import('expo-sharing') | null = null;
let Print: typeof import('expo-print') | null = null;

async function getFileSystem() {
  if (!FileSystem) {
    FileSystem = require('expo-file-system/legacy');
  }
  return FileSystem!;
}

async function getSharing() {
  if (!Sharing) {
    Sharing = require('expo-sharing');
  }
  return Sharing!;
}

async function getPrint() {
  if (!Print) {
    Print = require('expo-print');
  }
  return Print!;
}

export interface ExportData {
  title: string;
  subtitle?: string;
  generatedAt: Date;
  sections: ExportSection[];
}

export interface ExportSection {
  title: string;
  type: 'table' | 'stats' | 'text';
  data: ExportTableData | ExportStatsData | string;
}

export interface ExportTableData {
  headers: string[];
  rows: (string | number)[][];
}

export interface ExportStatsData {
  items: { label: string; value: string | number; change?: number }[];
}

// Generate CSV from table data
export function generateCSV(data: ExportTableData): string {
  const escape = (val: string | number) => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = data.headers.map(escape).join(',');
  const rows = data.rows.map((row) => row.map(escape).join(',')).join('\n');

  return `${header}\n${rows}`;
}

// Export to CSV file
export async function exportToCSV(
  data: ExportTableData,
  filename: string
): Promise<void> {
  const csv = generateCSV(data);

  if (Platform.OS === 'web') {
    // Web: Download directly
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    // Mobile: Use lazy-loaded native modules
    try {
      const fs = await getFileSystem();
      const sharing = await getSharing();

      const fileUri = `${fs.documentDirectory}${filename}.csv`;

      await fs.writeAsStringAsync(fileUri, csv, {
        encoding: fs.EncodingType.UTF8,
      });

      if (await sharing.isAvailableAsync()) {
        await sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export CSV',
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }
}

// Generate HTML report
function generateHTMLReport(data: ExportData): string {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const renderSection = (section: ExportSection) => {
    switch (section.type) {
      case 'table': {
        const tableData = section.data as ExportTableData;
        return `
          <div class="section">
            <h2>${section.title}</h2>
            <table>
              <thead>
                <tr>
                  ${tableData.headers.map((h) => `<th>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tableData.rows
                  .map(
                    (row) => `
                  <tr>
                    ${row.map((cell) => `<td>${cell}</td>`).join('')}
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      case 'stats': {
        const statsData = section.data as ExportStatsData;
        return `
          <div class="section">
            <h2>${section.title}</h2>
            <div class="stats-grid">
              ${statsData.items
                .map(
                  (item) => `
                <div class="stat-card">
                  <div class="stat-value">${item.value}</div>
                  <div class="stat-label">${item.label}</div>
                  ${
                    item.change !== undefined
                      ? `<div class="stat-change ${item.change >= 0 ? 'positive' : 'negative'}">
                      ${item.change >= 0 ? '+' : ''}${item.change.toFixed(1)}%
                    </div>`
                      : ''
                  }
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `;
      }
      case 'text':
        return `
          <div class="section">
            <h2>${section.title}</h2>
            <p>${section.data}</p>
          </div>
        `;
      default:
        return '';
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #1e293b; padding: 40px; max-width: 1000px; margin: 0 auto; }
        .header { margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
        .header h1 { font-size: 28px; color: #0f172a; margin-bottom: 8px; }
        .header .subtitle { color: #64748b; font-size: 14px; }
        .header .date { color: #94a3b8; font-size: 12px; margin-top: 8px; }
        .section { margin-bottom: 40px; }
        .section h2 { font-size: 18px; color: #334155; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; color: #475569; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
        .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: 700; color: #0f172a; }
        .stat-label { font-size: 13px; color: #64748b; margin-top: 4px; }
        .stat-change { font-size: 12px; font-weight: 500; margin-top: 8px; }
        .stat-change.positive { color: #10b981; }
        .stat-change.negative { color: #ef4444; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.title}</h1>
        ${data.subtitle ? `<p class="subtitle">${data.subtitle}</p>` : ''}
        <p class="date">Generated on ${formatDate(data.generatedAt)}</p>
      </div>
      ${data.sections.map(renderSection).join('')}
      <div class="footer">Generated by Marketing Hub</div>
    </body>
    </html>
  `;
}

// Export to PDF
export async function exportToPDF(
  data: ExportData,
  filename: string
): Promise<void> {
  const html = generateHTMLReport(data);

  if (Platform.OS === 'web') {
    // Web: Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  } else {
    // Mobile: Generate PDF
    try {
      const print = await getPrint();
      const fs = await getFileSystem();
      const sharing = await getSharing();

      const { uri } = await print.printToFileAsync({
        html,
        base64: false,
      });

      // Rename file
      const newUri = `${fs.documentDirectory}${filename}.pdf`;
      await fs.moveAsync({ from: uri, to: newUri });

      // Share
      if (await sharing.isAvailableAsync()) {
        await sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export PDF Report',
        });
      }
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  }
}

// Helper to create analytics report data
export function createAnalyticsReport(
  overviewStats: {
    visitors: number;
    pageViews: number;
    leads: number;
    conversions: number;
    changes: Record<string, number>;
  },
  topPages: { page: string; views: number; conversions: number }[],
  dateRange: string
): ExportData {
  return {
    title: 'Marketing Analytics Report',
    subtitle: `Data for ${dateRange}`,
    generatedAt: new Date(),
    sections: [
      {
        title: 'Overview',
        type: 'stats',
        data: {
          items: [
            {
              label: 'Total Visitors',
              value: overviewStats.visitors.toLocaleString(),
              change: overviewStats.changes.visitors,
            },
            {
              label: 'Page Views',
              value: overviewStats.pageViews.toLocaleString(),
              change: overviewStats.changes.pageViews,
            },
            {
              label: 'Leads Generated',
              value: overviewStats.leads.toLocaleString(),
              change: overviewStats.changes.leads,
            },
            {
              label: 'Conversions',
              value: overviewStats.conversions.toLocaleString(),
              change: overviewStats.changes.conversions,
            },
          ],
        } as ExportStatsData,
      },
      {
        title: 'Top Pages',
        type: 'table',
        data: {
          headers: ['Page', 'Views', 'Conversions', 'Conv. Rate'],
          rows: topPages.map((p) => [
            p.page,
            p.views.toLocaleString(),
            p.conversions.toLocaleString(),
            `${((p.conversions / p.views) * 100).toFixed(1)}%`,
          ]),
        } as ExportTableData,
      },
    ],
  };
}
