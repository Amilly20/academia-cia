import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "success" | "destructive" | "warning";
}

export default function StatsCard({ title, value, icon: Icon, variant = "default" }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
      <div className={`p-3 rounded-full ${variant === 'success' ? 'bg-success/10 text-success' : variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold font-heading">{value}</h3>
      </div>
    </div>
  );
}