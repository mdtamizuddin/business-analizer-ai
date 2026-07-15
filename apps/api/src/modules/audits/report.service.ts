import { Injectable } from '@nestjs/common';

export interface ReportAudit {
  companyName: string;
  website: string;
  industry?: string;
  scores?: { overall: number; categories: Record<string, number> };
  seoAnalysis?: any;
  performanceAnalysis?: any;
  brandingAnalysis?: any;
  executiveSummary?: string;
  recommendations: any[];
  completedAt?: Date;
}

@Injectable()
export class ReportService {
  /**
   * Build a self-contained, printable HTML report for an audit.
   */
  buildHtml(audit: ReportAudit): string {
    const overall = audit.scores?.overall ?? 0;
    const cats = audit.scores?.categories ?? {};

    const catRows = Object.entries(cats)
      .map(([k, v]) => this.scoreRow(k, v as number))
      .join('');

    const recs = (audit.recommendations ?? [])
      .map(
        (r, i) => `
        <div class="rec">
          <div class="rec-head">
            <span class="rec-num">${i + 1}</span>
            <span class="rec-title">${this.esc(r.title ?? 'Recommendation')}</span>
            <span class="badge ${this.priorityClass(r.priority)}">${this.esc(r.priority ?? 'medium')}</span>
          </div>
          <div class="rec-body">
            <p><strong>Problem:</strong> ${this.esc(r.problem ?? '')}</p>
            <p><strong>Business impact:</strong> ${this.esc(r.businessImpact ?? '')}</p>
            <p><strong>Effort:</strong> ${this.esc(r.estimatedEffort ?? '—')} · <strong>ROI:</strong> ${this.esc(r.estimatedRoi ?? '—')}</p>
            ${r.recommendedService ? `<p><strong>Service:</strong> ${this.esc(r.recommendedService)}</p>` : ''}
          </div>
        </div>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<title>ABAP Audit Report — ${this.esc(audit.companyName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 40px; background: #fff; }
  .header { border-bottom: 3px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { margin: 0; font-size: 26px; }
  .header .sub { color: #64748b; font-size: 14px; margin-top: 4px; }
  .overall { display: flex; align-items: center; gap: 20px; margin: 20px 0 30px; }
  .ring { width: 110px; height: 110px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 700; color: #fff; background: ${this.scoreColor(overall)}; }
  .section { margin: 28px 0; }
  .section h2 { font-size: 18px; border-left: 4px solid #4f46e5; padding-left: 10px; margin-bottom: 12px; }
  .cat-row { display: flex; align-items: center; gap: 12px; margin: 8px 0; }
  .cat-name { width: 180px; font-size: 14px; }
  .bar { flex: 1; height: 14px; background: #e2e8f0; border-radius: 7px; overflow: hidden; }
  .bar > span { display: block; height: 100%; background: ${this.scoreColor(overall)}; }
  .cat-val { width: 44px; text-align: right; font-weight: 600; font-size: 14px; }
  .summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; white-space: pre-wrap; font-size: 14px; line-height: 1.5; }
  .rec { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin: 12px 0; page-break-inside: avoid; }
  .rec-head { display: flex; align-items: center; gap: 10px; }
  .rec-num { width: 24px; height: 24px; border-radius: 50%; background: #4f46e5; color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; }
  .rec-title { font-weight: 600; flex: 1; }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; text-transform: capitalize; }
  .b-critical { background: #fee2e2; color: #b91c1c; }
  .b-high { background: #ffedd5; color: #c2410c; }
  .b-medium { background: #fef9c3; color: #a16207; }
  .b-low { background: #dcfce7; color: #15803d; }
  .rec-body p { margin: 6px 0; font-size: 13px; color: #334155; }
  .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 12px; color: #94a3b8; }
</style></head>
<body>
  <div class="header">
    <h1>AI Business Audit Report</h1>
    <div class="sub">${this.esc(audit.companyName)} · ${this.esc(audit.website)} ${audit.industry ? '· ' + this.esc(audit.industry) : ''}</div>
  </div>

  <div class="overall">
    <div class="ring">${overall}</div>
    <div>
      <div style="font-size:20px;font-weight:700;">Overall Digital Health Score</div>
      <div style="color:#64748b;font-size:14px;">Generated ${audit.completedAt ? new Date(audit.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="section">
    <h2>Category Scores</h2>
    ${catRows}
  </div>

  ${audit.executiveSummary ? `<div class="section"><h2>Executive Summary</h2><div class="summary">${this.esc(audit.executiveSummary)}</div></div>` : ''}

  <div class="section">
    <h2>Recommendations (${audit.recommendations?.length ?? 0})</h2>
    ${recs || '<p style="color:#94a3b8;">No recommendations generated.</p>'}
  </div>

  <div class="footer">Generated by AI Business Audit Platform (ABAP) · Confidential</div>
</body></html>`;
  }

  private scoreRow(name: string, value: number): string {
    return `<div class="cat-row">
      <div class="cat-name">${this.esc(name)}</div>
      <div class="bar"><span style="width:${value}%"></span></div>
      <div class="cat-val">${value}</div>
    </div>`;
  }

  private scoreColor(v: number): string {
    if (v >= 80) return '#22c55e';
    if (v >= 60) return '#eab308';
    return '#ef4444';
  }

  private priorityClass(p?: string): string {
    return 'b-' + (p ?? 'medium');
  }

  private esc(s: any): string {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
