'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, PlusCircle, Loader2, Trash2, StickyNote, Phone, Mail } from 'lucide-react';
import { leadsApi, type Lead, type LeadStatus } from '@/lib/leads-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-purple-100 text-purple-700',
  qualified: 'bg-indigo-100 text-indigo-700',
  proposal_sent: 'bg-amber-100 text-amber-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  won: 'Won',
  lost: 'Lost',
};

const NEXT_STATUS: Record<LeadStatus, LeadStatus | null> = {
  new: 'contacted',
  contacted: 'qualified',
  qualified: 'proposal_sent',
  proposal_sent: 'won',
  won: null,
  lost: null,
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [openLead, setOpenLead] = useState<Lead | null>(null);
  const [note, setNote] = useState('');

  const fetchLeads = useCallback(async () => {
    try {
      const data = await leadsApi.list();
      setLeads(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const createLead = async () => {
    if (!name.trim()) return;
    await leadsApi.create({ name: name.trim(), email: email.trim() || undefined, source: 'manual' });
    setName('');
    setEmail('');
    setShowForm(false);
    fetchLeads();
  };

  const advanceStatus = async (lead: Lead) => {
    const next = NEXT_STATUS[lead.status];
    if (!next) return;
    await leadsApi.update(lead._id, { status: next });
    fetchLeads();
  };

  const addNote = async (id: string) => {
    if (!note.trim()) return;
    await leadsApi.addNote(id, note.trim());
    setNote('');
    const updated = await leadsApi.get(id);
    setOpenLead(updated);
  };

  const removeLead = async (id: string) => {
    await leadsApi.remove(id);
    if (openLead?._id === id) setOpenLead(null);
    fetchLeads();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">Track audited companies through your sales pipeline</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <PlusCircle className="mr-1 h-4 w-4" /> New Lead
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Company / Name</label>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Email (optional)</label>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@acme.com"
              />
            </div>
            <Button size="sm" onClick={createLead}>Create</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead) => (
          <Card key={lead._id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOpenLead(lead)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900">{lead.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{lead.source} lead</p>
                </div>
                <Badge className={STATUS_COLORS[lead.status]}>{STATUS_LABELS[lead.status]}</Badge>
              </div>
              <div className="flex flex-col gap-1 text-xs text-slate-500">
                {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                {lead.estimatedValue && <span>Est. value: ${lead.estimatedValue.toLocaleString()}</span>}
                {lead.notes.length > 0 && <span className="flex items-center gap-1"><StickyNote className="h-3 w-3" />{lead.notes.length} note(s)</span>}
              </div>
              <div className="mt-3 flex gap-2">
                {NEXT_STATUS[lead.status] && (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); advanceStatus(lead); }}>
                    Advance
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); removeLead(lead._id); }}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {leads.length === 0 && (
          <p className="col-span-full text-center text-sm text-slate-400 py-12">
            No leads yet. Run an audit — every audited company becomes a lead automatically.
          </p>
        )}
      </div>

      {openLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpenLead(null)}>
          <Card className="max-h-[80vh] w-full max-w-lg overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{openLead.name}</CardTitle>
              <p className="text-xs text-slate-400">{STATUS_LABELS[openLead.status]} · {openLead.source}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1 text-sm">
                {openLead.email && <span className="flex items-center gap-2"><Mail className="h-4 w-4" />{openLead.email}</span>}
                {openLead.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4" />{openLead.phone}</span>}
                {openLead.estimatedValue && <span>Est. value: ${openLead.estimatedValue.toLocaleString()}</span>}
                {openLead.auditId && <span className="text-brand-600">From audit: {openLead.auditId}</span>}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Notes</p>
                <div className="space-y-2">
                  {openLead.notes.map((n, i) => (
                    <div key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {n.note}
                      <span className="block text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                  {openLead.notes.length === 0 && <p className="text-xs text-slate-400">No notes yet.</p>}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note..."
                  />
                  <Button size="sm" onClick={() => addNote(openLead._id)}><StickyNote className="mr-1 h-4 w-4" />Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
