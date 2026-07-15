'use client';

import { useState } from 'react';
import { Loader2, Share2, Search, CheckCircle2, XCircle } from 'lucide-react';
import { socialApi, type SocialResult } from '@/lib/social-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScoreCircle } from '@/components/ui/score-circle';

export default function SocialPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SocialResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const domain = url.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const profiles = [
        { platform: 'LinkedIn', url: `https://www.linkedin.com/company/${domain}` },
        { platform: 'Facebook', url: `https://www.facebook.com/${domain}` },
        { platform: 'Instagram', url: `https://www.instagram.com/${domain}` },
        { platform: 'TikTok', url: `https://www.tiktok.com/@${domain.replace(/\./g, '')}` },
      ];
      const data = await socialApi.analyze(profiles);
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
        <h1 className="text-2xl font-bold text-text-primary">Social Media Intelligence</h1>
        <p className="text-sm text-slate-400">Check social presence across LinkedIn, Facebook, Instagram, TikTok</p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex gap-3 p-4">
          <input
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="company.com"
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
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Share2 className="h-4 w-4" />Presence</CardTitle></CardHeader>
              <CardContent className="flex justify-center"><ScoreCircle score={result.presenceScore} size="lg" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Share2 className="h-4 w-4" />Consistency</CardTitle></CardHeader>
              <CardContent className="flex justify-center"><ScoreCircle score={result.consistencyScore} size="lg" /></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Profiles</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {result.profiles.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-sm font-medium text-slate-200">{p.platform}</span>
                  <span className="flex items-center gap-2 text-xs">
                    {p.found ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    {p.followerText && <span className="text-slate-400">{p.followerText}</span>}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>AI Summary</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-slate-300">{result.summary}</p></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
