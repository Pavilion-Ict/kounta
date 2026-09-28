import Ledger from "@/components/Ledger";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export default async function NonFixedCostProductPage() {
  const isSuperAdmin = true;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8">
        <Ledger tableName="digital_prints_ledger" title="Non-Fixed Cost Product" />
      </main>
    </div>
  );
}
