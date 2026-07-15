'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Textarea, Label } from '@/components/ui/input';
import { companiesApi, type Company } from '@/lib/companies-api';
import { auditsApi } from '@/lib/audits-api';
import { ApiError } from '@/lib/api';

export default function NewAuditPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    description: '',
  });
  const [options, setOptions] = useState({
    crawlDepth: 5,
    runSeoAudit: true,
    runAiProcessing: true,
  });

  useEffect(() => {
    companiesApi.list().then((data) => {
      setCompanies(data);
      if (data.length > 0) setSelectedCompanyId(data[0]._id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let companyId = selectedCompanyId;

      if (mode === 'new') {
        if (!formData.name || !formData.website) {
          setError('Company name and website are required');
          setSubmitting(false);
          return;
        }
        const website = formData.website.startsWith('http')
          ? formData.website
          : `https://${formData.website}`;
        const company = await companiesApi.create({
          name: formData.name,
          website,
          industry: formData.industry || undefined,
          description: formData.description || undefined,
        });
        companyId = company._id;
      }

      if (!companyId) {
        setError('Please select a company or create a new one');
        setSubmitting(false);
        return;
      }

      const audit = await auditsApi.create({
        companyId,
        crawlDepth: options.crawlDepth,
        runSeoAudit: options.runSeoAudit,
        runAiProcessing: options.runAiProcessing,
      });

      router.push(`/audits/${audit._id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create audit. Is the API running?');
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">New Audit</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
            <CardDescription>Select an existing company or add a new one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'existing'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-border text-slate-300 hover:bg-surface-hover'
                }`}
              >
                Existing Company
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'new'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-border text-slate-300 hover:bg-surface-hover'
                }`}
              >
                New Company
              </button>
            </div>

            {mode === 'existing' ? (
              companies.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No companies yet. Switch to &quot;New Company&quot; to add one.
                </p>
              ) : (
                <div>
                  <Label htmlFor="company">Select Company</Label>
                  <select
                    id="company"
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} — {c.website}
                      </option>
                    ))}
                  </select>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry (optional)</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g. Technology, Retail, Healthcare"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief company description..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Options</CardTitle>
            <CardDescription>Configure what to analyze</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="depth">Crawl Depth (number of pages)</Label>
              <Input
                id="depth"
                type="number"
                min={1}
                max={20}
                value={options.crawlDepth}
                onChange={(e) => setOptions({ ...options, crawlDepth: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.runSeoAudit}
                  onChange={(e) => setOptions({ ...options, runSeoAudit: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-200">SEO Analysis</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.runAiProcessing}
                  onChange={(e) => setOptions({ ...options, runAiProcessing: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-200">AI Recommendations</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting Audit...
            </>
          ) : (
            'Start Audit'
          )}
        </Button>
      </form>
    </div>
  );
}
