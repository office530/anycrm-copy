import React from 'react';
import ImportWizard from '@/components/import/ImportWizard';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImportLeadsPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Page Header */}
      <div className="bg-white border-b px-8 py-6 mb-8">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('Leads')}>
            <Button variant="ghost" size="icon">
                <ArrowRight className="w-5 h-5 text-slate-500" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">אשף ייבוא לידים</h1>
            <p className="text-slate-500 text-sm">ייבוא מהיר וחכם של לקוחות מקבצי Excel או CSV</p>
          </div>
        </div>
      </div>

      <ImportWizard />
    </div>
  );
}