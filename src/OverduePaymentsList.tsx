import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircleWarning } from "lucide-react";

export default function OverduePaymentsList() {
  const { data: overdue, isLoading } = useQuery({
    queryKey: ["overdue-payments"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("payments")
        .select("*, students(full_name, phone)")
        .in("status", ["pending", "overdue"])
        .lt("due_date", today)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleSendReminder = (payment: any) => {
    const phone = payment.students?.phone?.replace(/\D/g, "");
    if (!phone) return alert("O aluno não tem telefone cadastrado.");

    const amount = Number(payment.amount).toFixed(2).replace(".", ",");
    const pixKey = "12.345.678/0001-90"; // TODO: Coloque sua chave PIX aqui
    const message = `Olá ${payment.students?.full_name}, tudo bem? 🏋️‍♂️\n\nPassando para lembrar que sua mensalidade da Cia fitness no valor de R$ ${amount} está em aberto.\n\nPara facilitar, você pode pagar via PIX (Copia e Cola) usando a chave abaixo:\n\n*${pixKey}*\n\nQualquer dúvida, a recepção está à disposição!`;

    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-heading font-semibold text-card-foreground mb-4 text-destructive flex items-center gap-2">
        <MessageCircleWarning className="w-5 h-5" /> Mensalidades Atrasadas
      </h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
      ) : overdue && overdue.length > 0 ? (
        <div className="space-y-4">
          {overdue.map((p) => (
            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-3 last:border-0 last:pb-0">
              <div>
                <p className="font-medium text-card-foreground text-sm">{p.students?.full_name || "Desconhecido"}</p>
                <p className="text-xs text-muted-foreground">
                  Venceu em: {format(new Date(p.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} • R$ {Number(p.amount).toFixed(2)}
                </p>
              </div>
              <Button size="sm" variant="outline" className="text-primary hover:text-primary whitespace-nowrap" onClick={() => handleSendReminder(p)}>
                Notificar e Cobrar
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