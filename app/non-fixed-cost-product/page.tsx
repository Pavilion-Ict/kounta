import Ledger from "@/components/Ledger";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export default async function NonFixedCostProductPage() {
  const isSuperAdmin = true;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {isSuperAdmin && (
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                &larr; Back
              </Link>
            )}
            <h1 className="text-xl font-semibold text-gray-800">Non-Fixed Cost Product Admin</h1>
          </div>

        </div>
      </header>
      
      <main className="py-8">
        <Ledger tableName="digital_prints_ledger" title="Non-Fixed Cost Product" />
      </main>
    </div>
  );
}
