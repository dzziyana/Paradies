import { Home, ShoppingCart, Globe, TrendingUp, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Transaction {
  icon: LucideIcon;
  label: string;
  amount: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { icon: Home, label: "Monthly Rent Pull", amount: "-CHF 3\u2019200.00" },
  { icon: ShoppingCart, label: "REWE Groceries", amount: "-CHF 142.20" },
  { icon: Globe, label: "Fiber Internet", amount: "-CHF 44.90" },
];

export default function FinancesCard() {
  return (
    <div className="md:col-span-2 rounded-3xl bg-[#003b3f] p-5 text-white relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2">
            WG Balance Summary
          </p>
          <h3 className="font-headline text-4xl font-bold">
            CHF 4&apos;829.50
          </h3>
          <p className="font-body text-xs text-primary-fixed flex items-center gap-1 mt-1">
            <TrendingUp size={14} /> 12% vs last month
          </p>
        </div>
        <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
          <Wallet size={28} className="text-primary-fixed" />
        </div>
      </div>

      {/* Transactions */}
      <div className="space-y-3">
        <p className="font-label text-[10px] uppercase tracking-widest opacity-40">
          Recent Transactions
        </p>
        {MOCK_TRANSACTIONS.map((tx) => (
          <div
            key={tx.label}
            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl"
          >
            <div className="flex items-center gap-4">
              <tx.icon size={20} className="opacity-60" />
              <p className="font-body text-sm">{tx.label}</p>
            </div>
            <p className="font-body text-sm font-bold">{tx.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
