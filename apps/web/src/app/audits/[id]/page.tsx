'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Loader2, ExternalLink, Clock } from 'lucide-react';
import { auditsApi, type Audit } from '@/lib/audits-api';
import { companiesApi, type Company } from '@/lib/companies-api';
import { StatusBadge } from '@/components/ui/status-badge';
import { ScoreCircle } from '@/components/ui/score-circle';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { STAGE_LABELS, SCORE_CATEGORY_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const STAGES = [
  'company_discovery',
  'website_crawl',
  'seo_analysis',
  'ai_processing',
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
            <p className="text-sm text-slate-600">{error ?? 'Audit not found'}</p>
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
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{company?.name ?? 'Audit'}</h1>
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
        {audit.scores && <ScoreCircle score={audit.scores.overall} size="lg" />}
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
            <div className="flex items-center gap-2">
              {STAGES.map((stage, idx) => {
                const isActive = idx === currentStageIndex;
                const isDone = idx < currentStageIndex || audit.status === 'completed';
                return (
                  <div key={stage} className="flex items-center">
                    {idx > 0 && <div className={cn('h-0.5 w-8', isDone ? 'bg-brand-500' : 'bg-slate-200')} />}
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                        isActive && 'bg-brand-600 text-white animate-pulse',
                        isDone && 'bg-brand-100 text-brand-700',
                        !isActive && !isDone && 'bg-slate-100 text-slate-400',
                      )}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <span className={cn(
                      'ml-2 text-xs',
                      isActive ? 'font-medium text-brand-700' : isDone ? 'text-slate-600' : 'text-slate-400',
                    )}>
                      {STAGE_LABELS[stage] ?? stage}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
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
            <CardDescription>Weighted breakdown of digital health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(audit.scores.categories).map(([key, score]) => (
                <div key={key} className="flex flex-col items-center gap-1">
                  <ScoreCircle score={score} size="sm" />
                  <span className="text-xs text-slate-500 text-center">
                    {SCORE_CATEGORY_LABELS[key] ?? key}
                  </span>
                </div>
              ))}
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
                <p className="text-2xl font-bold text-slate-900">{audit.crawlData.totalPages}</p>
                <p className="text-xs text-slate-500">Pages Crawled</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {(audit.crawlData.crawlDurationMs / 1000).toFixed(1)}s
                </p>
                <p className="text-xs text-slate-500">Crawl Duration</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {audit.crawlData.pages.reduce((sum, p) => sum + (p.metadata.wordCount ?? 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">Words Analyzed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {audit.crawlData.pages.reduce((sum, p) => sum + (p.links.internal.length), 0)}
                </p>
                <p className="text-xs text-slate-500">Internal Links</p>
              </div>
            </div>
            {audit.crawlData.blockedPages.length > 0 && (
              <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-700">
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
                <div key={label as string} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <span className="text-xs text-slate-600">{label}</span>
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
                <p className="text-sm font-medium text-slate-700 mb-2">Issues Found:</p>
                {audit.seoAnalysis.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-0.5 text-red-400">•</span>
                    {issue}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {audit.recommendations.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
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
