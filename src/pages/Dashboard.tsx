import { useState, useEffect } from "react";
import StatsCard from "@/StatsCard";
import BirthdayList from "@/BirthdayList";
import OverduePaymentsList from "@/OverduePaymentsList";
import { Users, AlertTriangle, TrendingUp, Megaphone, PackageSearch, Loader2, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { getFirebaseData, setFirebaseData, generateStudentPayments, generateAutomaticNotifications } from "@/lib/localStorage";

export default function Dashboard() {
  const [stats, setStats] = useState<{
    activeStudents: number;
    overduePayments: number;
    totalRevenue: number;
  } | null>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentLost, setRecentLost] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      let data = await getFirebaseData();
      
      const studentsArray = Object.values(data.students || {});
      const paymentsArray = Object.values(data.payments || {});

      // Generate automatic payments for active students and update if needed
      const updatedPayments = generateStudentPayments(studentsArray, paymentsArray);
      let needsUpdate = false;
      if (updatedPayments.length > paymentsArray.length) {
        data.payments = updatedPayments;
        needsUpdate = true;
      }
      
      if (generateAutomaticNotifications(data)) {
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await setFirebaseData(data);
      }
      
      const activeStudents = studentsArray.filter((s: any) => s.status === "active").length;
      const today = new Date().toISOString().split("T")[0];
      const overduePayments = paymentsArray.filter(
        (p: any) => (p.status === "pending" || p.status === "overdue") && p.due_date <= today
      ).length;
      const totalRevenue = paymentsArray
        .filter((p: any) => p.status === "paid")
        .reduce((sum, p: any) => sum + Number(p.amount), 0);

      setStats({
        activeStudents,
        overduePayments,
        totalRevenue,
      });

      setRecentEvents(Object.values(data.events || {}).slice(0, 2));
      setRecentLost(Object.values(data.lostAndFound || {}).slice(0, 2));
      
      const messages = Object.values(data.messages || {}).filter((m: any) => m.sender === 'student').sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const uniqueRecent: any[] = [];
      const seen = new Set();
      for (const msg of messages) {
         if (!seen.has((msg as any).student_id)) {
             seen.add((msg as any).student_id);
             uniqueRecent.push(msg);
         }
      }
      setRecentMessages(uniqueRecent.slice(0, 3).map((m: any) => {
         const student = studentsArray.find((s: any) => s.id === m.student_id);
         return { ...m, studentName: student?.full_name || 'Aluno' };
      }));

      setIsLoading(false);
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

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

            <div className="rounded-xl border border-border bg-card p-6 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-card-foreground flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" /> Mensagens Recentes
                </h3>
                <Link to="/students" className="text-xs text-primary hover:underline">Ver Alunos</Link>
              </div>
              {recentMessages?.length ? (
                <ul className="space-y-3">
                  {recentMessages.map(msg => (
                    <li key={msg.id} className="text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-card-foreground">{msg.studentName}</p>
                        <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{msg.text}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Nenhuma mensagem recente.</p>}
            </div>
          </div>
        </div>
        <BirthdayList />
      </div>
    </div>
  );
}
