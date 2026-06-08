import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../../components/page-header';
import { getApprovalRequests } from '../../actions/approvals';
import { ApprovalList } from '../../../components/finance/approval-list';

export default async function ApprovalsPage() {
  const requests = await getApprovalRequests();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        subtitle="Review and process pending financial requests"
        icon={<ShieldCheck className="w-7 h-7" />}
      />

      <ApprovalList requests={requests} />
    </div>
  );
}
