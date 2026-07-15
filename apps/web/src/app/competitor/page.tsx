'use client';

import { useState } from 'react';
import { Loader2, TrendingUp, TrendingDown, Target, Search } from 'lucide-react';
import { competitorApi, type CompetitorResult } from '@/lib/competitor-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScoreCircle } from '@/components/ui/score-circle';

export default function CompetitorPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await competitorApi.analyze(url.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Competitor Intelligence</h1>
        <p className="text-sm text-slate-500">Crawl a competitor and compare against your audit</p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex gap-3 p-4">
          <input
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://competitor.com"
          />
          <Button size="sm" onClick={run} disabled={loading}>
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Search className="mr-1 h-4 w-4" />}
            Analyze
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ScoreCircle score={result.competitor.overallScore} size="sm" />
                {result.competitor.url}
              </CardTitle>
              <CardDescription>Competitor overall score</CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
              <CardContent><ScoreCircle score={result.competitor.seo.metaTagsScore} size="sm" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Performance</CardTitle></CardHeader>
              <CardContent><ScoreCircle score={result.competitor.performance.performanceScore} size="sm" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Branding</CardTitle></CardHeader>
              <CardContent><ScoreCircle score={result.competitor.branding.brandScore} size="sm" /></CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-green-200">
              <CardHeader><CardTitle className="flex items-center gap-2 text-green-700"><TrendingUp className="h-4 w-4" />Strengths</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.gap.strengths.map((s, i) => <p key={i} className="text-sm text-slate-600">• {s}</p>)}
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardHeader><CardTitle className="flex items-center gap-2 text-red-700"><TrendingDown className="h-4 w-4" />Weaknesses</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.gap.weaknesses.map((w, i) => <p key={i} className="text-sm text-slate-600">• {w}</p>)}
              </CardContent>
            </Card>
            <Card className="border-amber-200">
              <CardHeader><CardTitle className="flex items-center gap-2 text-amber-700"><Target className="h-4 w-4" />Opportunities</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.gap.opportunities.map((o, i) => <p key={i} className="text-sm text-slate-600">• {o}</p>)}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
