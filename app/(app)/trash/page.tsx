import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/PageHeader';
import TrashGrid from '@/components/TrashGrid';

export default async function TrashPage() {
  const supabase = await createClient();
  const { data: items } = await supabase.from('media').select('*').eq('is_deleted', true).order('deleted_at', { ascending: false });

  return (
    <div>
      <PageHeader title="Trash" subtitle="Deleted memories stay here for 30 days before permanent removal." showAdd={false} />
      <div className="px-4 sm:px-8 py-6 max-w-2xl">
        <TrashGrid initialItems={items ?? []} />
      </div>
    </div>
  );
}
