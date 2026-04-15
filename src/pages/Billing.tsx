import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import OverduePaymentsList from "@/OverduePaymentsList";
import { Plus, Check, MessageCircle } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Billing() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", amount: "", due_date: "" });

  const { data: students } = useQuery({
    queryKey: ["students-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id, full_name").eq("status", "active").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: allPayments, isLoading } = useQuery({
    queryKey: ["all-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, students(full_name)")
        .order("due_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const createPayment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("payments").insert({
        student_id: form.student_id,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-payments"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-payments"] });
      toast({ title: "Mensalidade registrada!" });
      setOpen(false);
      setForm({ student_id: "", amount: "", due_date: "" });
    },
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").update({ status: "paid" as const, paid_date: new Date().toISOString().split("T")[0] }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-payments"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Pagamento confirmado!" });
    },
  });

  const handleSendWhatsApp = (payment: any) => {
    const phone = payment.students?.phone?.replace(/\D/g, "");
    if (!phone) return alert("O aluno não tem telefone cadastrado.");

    const amount = Number(payment.amount).toFixed(2).replace(".", ",");
    const pixKey = "12.345.678/0001-90"; // TODO: Substitua por sua chave PIX real depois
    const message = `Olá ${payment.students?.full_name}, tudo bem? 🏋️‍♂️\n\nAqui é da Cia fitness! Sua mensalidade no valor de R$ ${amount} com vencimento para ${format(new Date(payment.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} já está disponível no sistema.\n\nPara facilitar, você pode pagar via PIX (Copia e Cola) usando a chave abaixo:\n\n*${pixKey}*\n\nQualquer dúvida, estamos à disposição!`;

    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const statusLabel: Record<string, string> = { pending: "Pendente", paid: "Pago", overdue: "Vencido" };
  const statusClass: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    paid: "bg-success/10 text-success border-success/20",
    overdue: "bg-overdue/10 text-overdue border-overdue/20",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Cobrança</h1>
          <p className="text-muted-foreground mt-1">Régua de cobrança e gestão de mensalidades</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-primary text-primary-foreground border-0">
              <Plus className="w-4 h-4" /> Nova Mensalidade
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader><DialogTitle className="font-heading">Registrar Mensalidade</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Aluno</Label>
                <Select value={form.student_id} onValueChange={(v) => setForm((f) => ({ ...f, student_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {students?.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
              </div>
              <Button
                onClick={() => createPayment.mutate()}
                disabled={!form.student_id || !form.amount || !form.due_date}
                className="w-full gradient-primary text-primary-foreground border-0"
              >
                Registrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <OverduePaymentsList />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-heading font-semibold text-card-foreground">Todas as Mensalidades</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Aluno</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Valor</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Vencimento</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : (
              allPayments?.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{p.students?.full_name || "—"}</td>
                  <td className="p-4 text-sm text-card-foreground">R$ {Number(p.amount).toFixed(2)}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(new Date(p.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="p-4">
                    <Badge className={statusClass[p.status]}>{statusLabel[p.status]}</Badge>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {p.status !== "paid" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleSendWhatsApp(p)} className="text-primary hover:text-primary border-primary hover:bg-primary/10">
                          <MessageCircle className="w-4 h-4 mr-1" /> Cobrar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => markPaid.mutate(p.id)} className="text-success hover:text-success hover:bg-success/10">
                          <Check className="w-4 h-4 mr-1" /> Confirmar
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
