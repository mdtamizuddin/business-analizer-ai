'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Building2, PlusCircle, ExternalLink, Loader2 } from 'lucide-react';
import { companiesApi, type Company } from '@/lib/companies-api';
import { auditsApi } from '@/lib/audits-api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>({});

  const fetchCompanies = useCallback(async () => {
    try {
      const data = await companiesApi.list();
      setCompanies(data);
      setLoading(false);

      const counts: Record<string, number> = {};
      for (const company of data) {
        try {
          const audits = await auditsApi.byCompany(company._id);
          counts[company._id] = audits.length;
        } catch { /* best-effort */ }
      }
      setAuditCounts(counts);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500 mt-1">{companies.length} companies</p>
        </div>
        <Link href="/audits/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Audit
          </Button>
        </Link>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-400 mb-4">No companies yet.</p>
            <Link href="/audits/new">
              <Button>Create your first audit</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold">
                    {company.name[0]?.toUpperCase()}
                  </div>
                  {auditCounts[company._id] !== undefined && auditCounts[company._id] > 0 && (
                    <Badge variant="neutral">
                      {auditCounts[company._id]} audit{auditCounts[company._id] > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900">{company.name}</h3>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
                >
                  {company.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {company.industry && (
                  <p className="mt-2 text-xs text-slate-500">{company.industry}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Link href={`/audits/new`}>
                    <Button size="sm" variant="secondary">New Audit</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
