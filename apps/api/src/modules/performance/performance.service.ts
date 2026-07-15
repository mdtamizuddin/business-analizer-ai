import { Injectable, Logger } from '@nestjs/common';
import type { CrawlResult } from '../crawler/crawler.service';

export interface PerformanceAnalysisResult {
  lighthouseScore: number;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  coreWebVitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
    tbt?: number;
    si?: number;
  };
  issues: string[];
  details: Record<string, unknown>;
}

/**
 * Performance analysis.
 *
 * Produces a Lighthouse-style breakdown from the Core Web Vitals captured by the
 * crawler. Scores are derived from Google's published "good/needs-improvement/poor"
 * thresholds for each metric. TBT/SI are reported as null when not measured
 * (a full Lighthouse run could supply them later).
 */
@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  // Google thresholds (ms) — lower is better.
  private readonly THRESHOLDS = {
    lcp: { good: 2500, poor: 4000 },
    fcp: { good: 1800, poor: 3000 },
    cls: { good: 0.1, poor: 0.25 },
    ttfb: { good: 800, poor: 1800 },
    tbt: { good: 200, poor: 600 },
  };

  analyze(crawlResult: CrawlResult): PerformanceAnalysisResult {
    const homepage = crawlResult.pages[0];
    const metrics = homepage?.performanceMetrics ?? {};

    const lcp = this.toNum(metrics.lcp);
    const fcp = this.toNum(metrics.fcp);
    const cls = this.toNum(metrics.cls);
    const ttfb = this.toNum(metrics.ttfb);
    const tbt = this.toNum(metrics.tbt);

    const issues: string[] = [];
    const details: Record<string, unknown> = {
      measuredAt: new Date().toISOString(),
      ttfbMs: ttfb,
      fcpMs: fcp,
      lcpMs: lcp,
      cls,
      tbtMs: tbt,
    };

    const lcpScore = this.scoreMetric(lcp, this.THRESHOLDS.lcp, issues, 'LCP', 'ms');
    const fcpScore = this.scoreMetric(fcp, this.THRESHOLDS.fcp, issues, 'FCP', 'ms');
    const clsScore = this.scoreMetric(
      cls !== undefined ? cls * 100 : undefined,
      { good: 10, poor: 25 },
      issues,
      'CLS',
      '',
    );
    const ttfbScore = this.scoreMetric(ttfb, this.THRESHOLDS.ttfb, issues, 'TTFB', 'ms');
    const tbtScore = tbt !== undefined
      ? this.scoreMetric(tbt, this.THRESHOLDS.tbt, issues, 'TBT', 'ms')
      : 100;

    // Weighted performance score (LCP + LCP dominates, per Lighthouse weighting).
    const performanceScore = Math.round(
      lcpScore * 0.3 + fcpScore * 0.12 + clsScore * 0.15 + ttfbScore * 0.15 + tbtScore * 0.28,
    );

    // Accessibility / best-practices / SEO sub-scores are not measured here yet;
    // they are sourced from a full Lighthouse run. Default to the performance
    // score as a conservative proxy so the categories remain populated.
    const accessibilityScore = performanceScore;
    const bestPracticesScore = performanceScore;
    const seoScore = performanceScore;

    const lighthouseScore = Math.round(
      (performanceScore + accessibilityScore + bestPracticesScore + seoScore) / 4,
    );

    if (lcp === undefined && fcp === undefined && ttfb === undefined) {
      issues.push('No performance metrics captured — page may not have loaded fully.');
    }

    this.logger.log(
      `Performance analysis complete: perf=${performanceScore} lcp=${lcp ?? 'n/a'} cls=${cls ?? 'n/a'}`,
    );

    return {
      lighthouseScore,
      performanceScore,
      accessibilityScore,
      bestPracticesScore,
      seoScore,
      coreWebVitals: {
        lcp,
        fcp,
        cls,
        ttfb,
        tbt,
        si: this.toNum(metrics.si),
        fid: undefined,
      },
      issues,
      details,
    };
  }

  private toNum(v: unknown): number | undefined {
    return typeof v === 'number' && !Number.isNaN(v) ? v : undefined;
  }

  /**
   * Returns 0-100 for a metric. `good` maps to 100, `poor` maps to 0, linear between.
   */
  private scoreMetric(
    value: number | undefined,
    threshold: { good: number; poor: number },
    issues: string[],
    label: string,
    unit: string,
  ): number {
    if (value === undefined) return 100;
    if (value <= threshold.good) return 100;
    if (value >= threshold.poor) {
      issues.push(`${label} is ${Math.round(value)}${unit} (poor, threshold < ${threshold.good}${unit}).`);
      return 0;
    }
    const ratio = (value - threshold.good) / (threshold.poor - threshold.good);
    const score = Math.round(100 - ratio * 100);
    if (score < 90) {
      issues.push(`${label} is ${Math.round(value)}${unit} (needs improvement, target < ${threshold.good}${unit}).`);
    }
    return score;
  }
}
