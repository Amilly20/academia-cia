import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import StatsCard from "@/StatsCard";
import BirthdayList from "@/BirthdayList";
import OverduePaymentsList from "@/OverduePaymentsList";
import { Users, AlertTriangle, TrendingUp, Megaphone, PackageSearch } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [studentsRes, overdueRes, paidRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact" }).eq("status", "active"),
        supabase.from("payments").select("id", { count: "exact" }).in("status", ["pending", "overdue"]).lte("due_date", new Date().toISOString().split("T")[0]),
        supabase.from("payments").select("amount").eq("status", "paid"),
      ]);
      const totalRevenue = (paidRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0);
      return {
        activeStudents: studentsRes.count || 0,
        overduePayments: overdueRes.count || 0,
        totalRevenue,
      };
    },
  });

  const { data: recentEvents } = useQuery({
    queryKey: ["recent-events-dashboard"],
    queryFn: async () => {
      const { data } = await supabase.from("commemorative_dates").select("*").neq("title", "SYSTEM_LOGO").gte("event_date", new Date().toISOString().split("T")[0]).order("event_date").limit(2);
      return data || [];
    }
  });

  const { data: recentLost } = useQuery({
    queryKey: ["recent-lost-dashboard"],
    queryFn: async () => {
      const { data } = await supabase.from("lost_and_found").select("*").eq("claimed", false).order("created_at", { ascending: false }).limit(2);
      return data || [];
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da academia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Alunos Ativos"
          value={stats?.activeStudents ?? "—"}
          icon={Users}
          variant="success"
        />
        <StatsCard
          title="Mensalidades Vencidas"
          value={stats?.overduePayments ?? "—"}
          icon={AlertTriangle}
          variant="destructive"
        />
        <StatsCard
          title="Receita Total"
          value={`R$ ${(stats?.totalRevenue ?? 0).toFixed(2)}`}
          icon={TrendingUp}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <OverduePaymentsList />

          {/* Mural do Admin - Lembretes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-card-foreground flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" /> Próximos Eventos
                </h3>
                <Link to="/events" className="text-xs text-primary hover:underline">Gerenciar</Link>
              </div>
              {recentEvents?.length ? (
                <ul className="space-y-3">
                  {recentEvents.map(ev => (
                    <li key={ev.id} className="text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                      <p className="font-medium text-card-foreground">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(ev.event_date + "T12:00:00").toLocaleDateString('pt-BR')}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Nenhum evento próximo.</p>}
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-card-foreground flex items-center gap-2">
                  <PackageSearch className="w-5 h-5 text-warning" /> Achados e Perdidos
                </h3>
                <Link to="/lost-found" className="text-xs text-primary hover:underline">Ver todos</Link>
              </div>
              {recentLost?.length ? (
                <ul className="space-y-3">
                  {recentLost.map(item => (
                    <li key={item.id} className="text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                      <p className="font-medium text-card-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">Encontrado em: {new Date(item.found_date + "T12:00:00").toLocaleDateString('pt-BR')}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Nenhum item pendente.</p>}
            </div>
          </div>
        </div>
        <BirthdayList />
      </div>
    </div>
  );
}
