import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircleWarning, Bell, Loader2 } from "lucide-react";
import { getFirebaseData, setFirebaseData } from "@/lib/localStorage";
import { toast } from "@/hooks/use-toast";

export default function OverduePaymentsList() {
  const [overdue, setOverdue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    const data = await getFirebaseData();
    const payments = Object.values(data.payments || {});
    const students = Object.values(data.students || {});
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overduePayments = payments
      .filter((p: any) => (p.status === "pending" || p.status === "overdue") && new Date(p.due_date + "T12:00:00") < today)
      .sort((a: any, b: any) => a.due_date.localeCompare(b.due_date))
      .map((p: any) => ({
        ...p,
        student: students.find((s: any) => s.id === p.student_id),
      }));

    setOverdue(overduePayments);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendReminder = async (payment: any) => {
    const amount = Number(payment.amount).toFixed(2).replace(".", ",");
    const message = `Olá ${payment.student?.full_name}, tudo bem? 🏋️‍♂️\n\nPassando para lembrar que sua mensalidade da Cia fitness no valor de R$ ${amount} está em aberto.\n\nQualquer dúvida, a recepção está à disposição!`;
    
    // Create notification
    const data = await getFirebaseData();
    const notifications = Object.values(data.notifications || {});
    const newNotification = {
      id: String(Date.now()),
      student_id: payment.student_id,
      title: "Cobrança de Mensalidade",
      message: message,
      type: "payment",
      read: false,
      created_at: new Date().toISOString(),
      payment_id: payment.id,
    };
    
    notifications.push(newNotification);
    data.notifications = notifications;
    await setFirebaseData(data);
    
    toast({ 
      title: "Notificação enviada", 
      description: `Notificação enviada para ${payment.student?.full_name}` 
    });
  };

  if (isLoading) {
    return <div className="rounded-xl border border-border bg-card p-6 flex justify-center items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-heading font-semibold text-card-foreground mb-4 text-destructive flex items-center gap-2">
        <MessageCircleWarning className="w-5 h-5" /> Mensalidades Atrasadas
      </h3>
      {overdue.length > 0 ? (
        <div className="space-y-4">
          {overdue.map((p) => (
            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-3 last:border-0 last:pb-0">
              <div>
                <p className="font-medium text-card-foreground text-sm">{p.student?.full_name || "Desconhecido"}</p>
                <p className="text-xs text-muted-foreground">
                  Venceu em: {format(new Date(p.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} • R$ {Number(p.amount).toFixed(2)}
                </p>
              </div>
              <Button size="sm" variant="outline" className="text-primary hover:text-primary whitespace-nowrap gap-1" onClick={() => handleSendReminder(p)}>
                <Bell className="w-4 h-4" /> Notificar e Cobrar
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensalidade em atraso no momento.</p>
      )}
    </div>
  );
}