'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Loader2, ExternalLink, Clock, Type, Image as ImageIcon, CheckCircle2, XCircle, FileDown, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { auditsApi, type Audit } from '@/lib/audits-api';
import { companiesApi, type Company } from '@/lib/companies-api';
import { API_BASE } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { ScoreCircle } from '@/components/ui/score-circle';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { STAGE_LABELS, SCORE_CATEGORY_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e'; // excellent
  if (score >= 70) return '#4F8CFF'; // good
  if (score >= 40) return '#F59E0B'; // needs improvement
  return '#EF4444'; // critical
}

const STAGES = [
  'company_input',
  'company_discovery',
  'data_collection',
  'website_analysis',
  'brand_analysis',
  'social_analysis',
  'competitor_research',
  'ai_processing',
  'business_scoring',
  'recommendations',
  'report_generation',
  'sales_proposal',
];

export default function AuditDetailPage() {
  const params = useParams();
  const auditId = params.id as string;
  const [audit, setAudit] = useState<Audit | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = useCallback(async () => {
    try {
      const data = await auditsApi.get(auditId);
      setAudit(data);
      setError(null);
      if (data.companyId) {
        try {
          const comp = await companiesApi.get(data.companyId);
          setCompany(comp);
        } catch { /* company fetch is best-effort */ }
      }
      if (['completed', 'failed'].includes(data.status)) {
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit');
      setLoading(false);
    }
  }, [auditId]);

  useEffect(() => {
    fetchAudit();
    const interval = setInterval(fetchAudit, 3000);
    return () => clearInterval(interval);
  }, [fetchAudit]);

  if (loading && !audit) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-3 p-8">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-slate-300">{error ?? 'Audit not found'}</p>
            <Link href="/dashboard">
              <Button size="sm">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isInProgress = !['completed', 'failed'].includes(audit.status);
  const currentStageIndex = STAGES.indexOf(audit.currentStage ?? '');

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">{company?.name ?? 'Audit'}</h1>
            <StatusBadge status={audit.status} />
          </div>
          {company?.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
            >
              {company.website}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <p className="text-xs text-slate-400 mt-1">
            Started {new Date(audit.startedAt).toLocaleString()}
            {audit.completedAt && (
              <> · Completed {new Date(audit.completedAt).toLocaleString()}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {audit.scores && <ScoreCircle score={audit.scores.overall} size="lg" />}
          <a
            href={`${API_BASE}/audits/${audit._id}/report?format=pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-slate-200 hover:bg-surface-hover"
          >
            <FileDown className="h-4 w-4" /> PDF
          </a>
          <a
            href={`${API_BASE}/audits/${audit._id}/report?format=html`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-slate-200 hover:bg-surface-hover"
          >
            <FileText className="h-4 w-4" /> HTML
          </a>
        </div>
      </div>

      {/* Error display */}
      {audit.error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {audit.error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress tracker */}
      {isInProgress && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Audit Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              {STAGES.map((stage, idx) => {
                const isActive = idx === currentStageIndex;
                const isDone = idx < currentStageIndex || audit.status === 'completed';
                return (
                  <div key={stage} className="flex items-center">
                    {idx > 0 && <div className={cn('h-0.5 w-6', isDone ? 'bg-primary' : 'bg-surface-hover')} />}
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                        isActive && 'bg-primary text-white animate-pulse shadow-glow-primary',
                        isDone && 'bg-primary/15 text-primary',
                        !isActive && !isDone && 'bg-surface-hover text-text-secondary',
                      )}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <span className={cn(
                      'ml-1.5 text-xs',
                      isActive ? 'font-medium text-primary' : isDone ? 'text-slate-300' : 'text-text-secondary',
                    )}>
                      {STAGE_LABELS[stage] ?? stage}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <Clock className="h-4 w-4" />
              Elapsed: {Math.round((Date.now() - new Date(audit.startedAt).getTime()) / 1000)}s
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scores */}
      {audit.scores && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Category Scores</CardTitle>
            <CardDescription>Weighted breakdown of digital health · Overall {audit.scores.overall}/100</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {Object.entries(audit.scores.categories).map(([key, score]) => (
                <div key={key} className="flex flex-col items-center gap-1">
                  <ScoreCircle score={score} size="sm" />
                  <span className="text-xs text-slate-400 text-center">
                    {SCORE_CATEGORY_LABELS[key] ?? key}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(audit.scores.categories).map(([key, score]) => ({ name: SCORE_CATEGORY_LABELS[key] ?? key, score }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #263247', borderRadius: 8, color: '#fff' }}
                    labelStyle={{ color: '#94A3B8' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {Object.entries(audit.scores.categories).map(([, score]) => (
                      <Cell key={score} fill={scoreColor(score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crawl Summary */}
      {audit.crawlData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Crawl Summary</CardTitle>
            <CardDescription>Website analysis results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-text-primary">{audit.crawlData.totalPages}</p>
                <p className="text-xs text-slate-400">Pages Crawled</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {(audit.crawlData.crawlDurationMs / 1000).toFixed(1)}s
                </p>
                <p className="text-xs text-slate-400">Crawl Duration</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {audit.crawlData.pages.reduce((sum, p) => sum + (p.metadata.wordCount ?? 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">Words Analyzed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {audit.crawlData.pages.reduce((sum, p) => sum + (p.links.internal.length), 0)}
                </p>
                <p className="text-xs text-slate-400">Internal Links</p>
              </div>
            </div>
            {audit.crawlData.blockedPages.length > 0 && (
              <div className="mt-4 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-warning">
                {audit.crawlData.blockedPages.length} page(s) blocked or failed during crawl
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SEO Analysis */}
      {audit.seoAnalysis && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>SEO Analysis</CardTitle>
            <CardDescription>{audit.seoAnalysis.issues.length} issues identified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                ['Meta Tags', audit.seoAnalysis.metaTagsScore],
                ['Headings', audit.seoAnalysis.headingsScore],
                ['Structured Data', audit.seoAnalysis.structuredDataScore],
                ['Canonical', audit.seoAnalysis.canonicalScore],
                ['Sitemap', audit.seoAnalysis.sitemapScore],
                ['Robots', audit.seoAnalysis.robotsScore],
                ['Open Graph', audit.seoAnalysis.openGraphScore],
                ['Image SEO', audit.seoAnalysis.imageSeoScore],
                ['Internal Links', audit.seoAnalysis.internalLinksScore],
                ['External Links', audit.seoAnalysis.externalLinksScore],
                ['Performance SEO', audit.seoAnalysis.performanceSeoScore],
              ].map(([label, score]) => (
                <div key={label as string} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-xs text-slate-300">{label}</span>
                  <span className={cn(
                    'text-sm font-bold',
                    (score as number) >= 80 ? 'text-green-600' : (score as number) >= 60 ? 'text-yellow-600' : 'text-red-600',
                  )}>
                    {score}
                  </span>
                </div>
              ))}
            </div>
            {audit.seoAnalysis.issues.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200 mb-2">Issues Found:</p>
                {audit.seoAnalysis.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-red-400">•</span>
                    {issue}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Company Discovery (Stage 2) */}
      {audit.companyDiscovery && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Company Discovery</CardTitle>
            <CardDescription>Reverse DNS, IP &amp; industry enrichment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <p className="text-2xl font-bold text-text-primary">{audit.companyDiscovery.industry ?? '—'}</p>
                <p className="text-xs text-text-secondary">Industry</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{audit.companyDiscovery.ip ?? '—'}</p>
                <p className="text-xs text-text-secondary">IP Address</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{audit.companyDiscovery.hostname ?? '—'}</p>
                <p className="text-xs text-text-secondary">Reverse DNS</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{audit.companyDiscovery.localBusiness ? 'Yes' : 'No'}</p>
                <p className="text-xs text-text-secondary">Local Business</p>
              </div>
            </div>
            {audit.companyDiscovery.notes?.length > 0 && (
              <div className="space-y-1">
                {audit.companyDiscovery.notes.map((n: string, i: number) => (
                  <p key={i} className="text-xs text-slate-300">• {n}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Brand Vision (Stage 5) */}
      {audit.brandVision?.critique && (
        <Card className="mb-6 border-secondary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-ai-premium" /> Brand Vision Analysis
            </CardTitle>
            <CardDescription>AI visual critique of the homepage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{audit.brandVision.critique}</p>
          </CardContent>
        </Card>
      )}

      {/* Social Snapshot (Stage 6) */}
      {audit.socialSnapshot && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Social Presence</CardTitle>
            <CardDescription>Presence {audit.socialSnapshot.presenceScore} · Consistency {audit.socialSnapshot.consistencyScore}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300 mb-3">{audit.socialSnapshot.summary}</p>
            <div className="space-y-1">
              {audit.socialSnapshot.profiles.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="font-medium text-text-primary">{p.platform}</span>
                  <span className={p.found ? 'text-success' : 'text-danger'}>{p.found ? (p.followerText ?? 'Found') : 'Not found'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitor Snapshot (Stage 7) */}
      {audit.competitorSnapshot && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Competitor Intelligence</CardTitle>
            <CardDescription>{audit.competitorSnapshot.competitor.url} · score {audit.competitorSnapshot.competitor.overallScore}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-success mb-1">Strengths</p>
                {audit.competitorSnapshot.gap.strengths.map((s: string, i: number) => <p key={i} className="text-sm text-slate-300">• {s}</p>)}
              </div>
              <div>
                <p className="text-xs font-semibold text-warning mb-1">Weaknesses</p>
                {audit.competitorSnapshot.gap.weaknesses.map((w: string, i: number) => <p key={i} className="text-sm text-slate-300">• {w}</p>)}
              </div>
              <div>
                <p className="text-xs font-semibold text-primary mb-1">Opportunities</p>
                {audit.competitorSnapshot.gap.opportunities.map((o: string, i: number) => <p key={i} className="text-sm text-slate-300">• {o}</p>)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Executive Summary */}
      {audit.executiveSummary && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
            <CardDescription>AI-generated strategic overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-slate-200">
              {audit.executiveSummary}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Analysis */}
      {audit.performanceAnalysis && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance Analysis</CardTitle>
            <CardDescription>Core Web Vitals &amp; load performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                ['Lighthouse', audit.performanceAnalysis.lighthouseScore],
                ['Performance', audit.performanceAnalysis.performanceScore],
                ['Accessibility', audit.performanceAnalysis.accessibilityScore],
                ['Best Practices', audit.performanceAnalysis.bestPracticesScore],
              ].map(([label, score]) => (
                <div key={label as string} className="flex flex-col items-center gap-1 rounded-lg border border-border px-3 py-3">
                  <ScoreCircle score={score as number} size="sm" />
                  <span className="text-xs text-slate-300">{label}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {[
                ['LCP', audit.performanceAnalysis.coreWebVitals.lcp, 'ms'],
                ['FCP', audit.performanceAnalysis.coreWebVitals.fcp, 'ms'],
                ['CLS', audit.performanceAnalysis.coreWebVitals.cls, ''],
                ['TTFB', audit.performanceAnalysis.coreWebVitals.ttfb, 'ms'],
                ['TBT', audit.performanceAnalysis.coreWebVitals.tbt, 'ms'],
                ['SI', audit.performanceAnalysis.coreWebVitals.si, 'ms'],
              ].map(([label, value, unit]) => (
                <div key={label as string} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-xs text-slate-300">{label}</span>
                  <span className="text-sm font-bold text-text-primary">
                    {value === undefined || value === null ? '—' : `${Math.round(value as number)}${unit}`}
                  </span>
                </div>
              ))}
            </div>
            {audit.performanceAnalysis.issues.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200 mb-2">Issues Found:</p>
                {audit.performanceAnalysis.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-red-400">•</span>
                    {issue}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Branding Analysis */}
      {audit.brandingAnalysis && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Branding Analysis</CardTitle>
            <CardDescription>Visual identity signals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                {audit.brandingAnalysis.logoPresent ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                <span className="text-xs text-slate-300">Logo</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                {audit.brandingAnalysis.hasFavicon ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                <span className="text-xs text-slate-300">Favicon</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <ImageIcon className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-300">{audit.brandingAnalysis.imageCount} homepage imgs</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <Type className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-300">{audit.brandingAnalysis.fontsDetected.length} brand fonts</span>
              </div>
            </div>
            {audit.brandingAnalysis.colorsDetected.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-300 mb-2">Detected Colors</p>
                <div className="flex flex-wrap gap-2">
                  {audit.brandingAnalysis.colorsDetected.map((c) => (
                    <div key={c} className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1">
                      <span className="h-4 w-4 rounded border border-border" style={{ backgroundColor: c }} />
                      <span className="text-xs text-slate-400">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {audit.brandingAnalysis.issues.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200 mb-2">Issues Found:</p>
                {audit.brandingAnalysis.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-red-400">•</span>
                    {issue}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sales Proposal (Stage 12) */}
      {audit.proposal && (
        <Card className="mb-6 border-ai-premium/40 bg-ai-premium/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-ai-premium" /> Sales Proposal
            </CardTitle>
            <CardDescription>{audit.proposal.headline}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-text-secondary">
                    <th className="py-2 pr-4 font-medium">Service</th>
                    <th className="py-2 pr-4 font-medium">Effort</th>
                    <th className="py-2 pr-4 font-medium text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.proposal.lineItems.map((li: any, i: number) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="py-2 pr-4 text-text-primary">{li.service}</td>
                      <td className="py-2 pr-4 text-text-secondary">{li.effort}</td>
                      <td className="py-2 pr-4 text-right font-semibold text-text-primary">${li.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <span className="text-text-secondary">Subtotal: </span>
                <span className="font-bold text-text-primary">${audit.proposal.subtotal.toLocaleString()}</span>
                <span className="text-text-secondary ml-4">Monthly retainer: </span>
                <span className="font-bold text-primary">${audit.proposal.monthlyRetainer.toLocaleString()}</span>
              </div>
              <div className="rounded-lg bg-success/10 px-3 py-1 text-xs text-success">
                {audit.proposal.estimatedRoi}
              </div>
            </div>
            <a
              href={`${API_BASE}/audits/${audit._id}/report?format=pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 rounded-lg bg-ai-premium px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <FileDown className="h-4 w-4" /> Export Proposal PDF
            </a>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {audit.recommendations.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-text-primary">
            Recommendations ({audit.recommendations.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {audit.recommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Waiting state */}
      {isInProgress && !audit.scores && (
        <Card className="border-brand-200 bg-brand-50">
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-brand-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">
                {audit.currentStage ? STAGE_LABELS[audit.currentStage] ?? audit.currentStage : 'Processing'}...
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
