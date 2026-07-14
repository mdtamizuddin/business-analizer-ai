'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PlusCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { auditsApi, type Audit } from '@/lib/audits-api';
import { companiesApi, type Company } from '@/lib/companies-api';
import { StatusBadge } from '@/components/ui/status-badge';
import { ScoreCircle } from '@/components/ui/score-circle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [auditData, companyData] = await Promise.all([
        auditsApi.list(),
        companiesApi.list(),
      ]);
      setAudits(auditData);
      setCompanies(companyData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const companyMap = new Map(companies.map((c) => [c._id, c]));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-400">Loading audits...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-3 p-8">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-slate-600">{error}</p>
            <Button onClick={fetchData} size="sm">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeAudits = audits.filter((a) => !['completed', 'failed'].includes(a.status));
  const completedAudits = audits.filter((a) => a.status === 'completed');

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {audits.length} total audits · {activeAudits.length} in progress · {completedAudits.length} completed
          </p>
        </div>
        <Link href="/audits/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Audit
          </Button>
        </Link>
      </div>

      {activeAudits.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">In Progress</h2>
          <div className="space-y-2">
            {activeAudits.map((audit) => {
              const company = companyMap.get(audit.companyId);
              return (
                <Link key={audit._id} href={`/audits/${audit._id}`}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <StatusBadge status={audit.status} />
                        <div>
                          <p className="font-medium text-slate-900">
                            {company?.name ?? 'Unknown Company'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {company?.website} · Started {new Date(audit.startedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">All Audits</h2>
        {audits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-slate-400 mb-4">No audits yet. Start your first website analysis.</p>
              <Link href="/audits/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create First Audit
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {audits.map((audit) => {
              const company = companyMap.get(audit.companyId);
              return (
                <Link key={audit._id} href={`/audits/${audit._id}`}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        {audit.scores ? (
                          <ScoreCircle score={audit.scores.overall} size="sm" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center">
                            <StatusBadge status={audit.status} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">
                            {company?.name ?? 'Unknown Company'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {company?.website} · {new Date(audit.createdAt).toLocaleDateString()}
                          </p>
                          {audit.recommendations.length > 0 && (
                            <p className="text-xs text-brand-600 mt-0.5">
                              {audit.recommendations.length} recommendations
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
