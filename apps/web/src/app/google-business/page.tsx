'use client';

import { useState } from 'react';
import { Loader2, Star, Search, ThumbsUp, ThumbsDown, MapPin } from 'lucide-react';
import { googleBusinessApi, type GoogleBusinessResult } from '@/lib/google-business-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SENTIMENT_COLOR: Record<string, string> = {
  positive: 'text-green-600',
  mixed: 'text-amber-600',
  negative: 'text-red-600',
  unknown: 'text-slate-400',
};

export default function GoogleBusinessPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GoogleBusinessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await googleBusinessApi.analyze(url.trim());
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
        <h1 className="text-2xl font-bold text-slate-900">Google Business Intelligence</h1>
        <p className="text-sm text-slate-500">Analyze ratings, reviews sentiment, and local SEO</p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex gap-3 p-4">
          <input
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://maps.google.com/?cid=..."
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
              <CardTitle className="flex items-center justify-between">
                <span>{result.name ?? 'Google Business Profile'}</span>
                {result.rating !== undefined && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4" />{result.rating} ({result.reviewCount ?? 0})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Sentiment: <span className={SENTIMENT_COLOR[result.sentiment]}>{result.sentiment}</span>
                {!result.hasWebsite && ' · No website linked'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{result.summary}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-red-200">
              <CardHeader><CardTitle className="flex items-center gap-2 text-red-700"><ThumbsDown className="h-4 w-4" />Top Complaints</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {result.topComplaints.length ? result.topComplaints.map((c, i) => <p key={i} className="text-sm text-slate-600">• {c}</p>)
                  : <p className="text-xs text-slate-400">None detected.</p>}
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardHeader><CardTitle className="flex items-center gap-2 text-green-700"><ThumbsUp className="h-4 w-4" />Top Praises</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {result.topPraises.length ? result.topPraises.map((c, i) => <p key={i} className="text-sm text-slate-600">• {c}</p>)
                  : <p className="text-xs text-slate-400">None detected.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
