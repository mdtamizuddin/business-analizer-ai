import { Badge } from './badge';
import { Card, CardContent, CardHeader } from './card';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';
import type { AuditRecommendation } from '@/lib/audits-api';

const TYPE_LABELS: Record<string, string> = {
  website_improvement: 'Website',
  branding_improvement: 'Branding',
  seo_improvement: 'SEO',
  marketing_opportunity: 'Marketing',
  automation_opportunity: 'Automation',
  ai_opportunity: 'AI',
  mobile_app_suggestion: 'Mobile App',
  crm_suggestion: 'CRM',
  business_growth: 'Growth',
};

export function RecommendationCard({ rec }: { rec: AuditRecommendation }) {
  const priorityColor = PRIORITY_COLORS[rec.priority] ?? '#94a3b8';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{TYPE_LABELS[rec.type] ?? rec.type}</Badge>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}
          >
            {PRIORITY_LABELS[rec.priority] ?? rec.priority}
          </span>
        </div>
        {rec.recommendedService && (
          <span className="text-xs text-slate-500">{rec.recommendedService}</span>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <h4 className="font-semibold text-slate-900">{rec.title}</h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-slate-600">Problem: </span>
            <span className="text-slate-700">{rec.problem}</span>
          </div>
          <div>
            <span className="font-medium text-slate-600">Evidence: </span>
            <span className="text-slate-700">{rec.evidence}</span>
          </div>
          <div>
            <span className="font-medium text-slate-600">Business Impact: </span>
            <span className="text-slate-700">{rec.businessImpact}</span>
          </div>
        </div>
        <div className="flex gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Effort: <span className="font-medium text-slate-700">{rec.estimatedEffort}</span></span>
          <span>ROI: <span className="font-medium text-slate-700">{rec.estimatedRoi}</span></span>
        </div>
      </CardContent>
    </Card>
  );
}
