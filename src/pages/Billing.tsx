import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import OverduePaymentsList from "@/OverduePaymentsList";
import { Plus, Check, MessageCircle, Edit2, Trash2, Eye, EyeOff, Loader2, Wallet, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getFirebaseData, setFirebaseData, generateStudentPayments, generateAutomaticNotifications } from "@/lib/localStorage";

export default function Billing() {
  const [open, setOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<any>({});
  const [form, setForm] = useState({ student_id: "", amount: "", due_date: "" });
  const [students, setStudents] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [proofs, setProofs] = useState<any[]>([]);

  // Load data from localStorage on mount
  const fetchData = async () => {
    setIsLoading(true);
    let data = await getFirebaseData();
    
    const studentsArray = Object.values(data.students || {});
    const paymentsArray = Object.values(data.payments || {});

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

    const activeStudents = studentsArray.filter((s: any) => s.status === "active").sort((a: any, b: any) => a.full_name.localeCompare(b.full_name));
    setStudents(activeStudents);

    const paymentsWithStudents = Object.values(data.payments || {})
      .filter((p: any) => {
        return p.status !== "paid" && p.status !== "archived";
      })
      .map((payment: any) => {
        const student = studentsArray.find((s: any) => s.id === payment.student_id);
        return {
          ...payment,
          students: student ? { full_name: student.full_name, phone: student.phone } : null
        };
      })
      .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    
    setAllPayments(paymentsWithStudents);
    setProofs(Object.values(data.paymentProofs || {}));
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePayment = async () => {
    if (!form.student_id || !form.amount || !form.due_date) return;
    
    const data = await getFirebaseData();
    const payments = Object.values(data.payments || {});
    
    const newPayment = {
      id: String(Math.max(0, ...payments.map(p => parseInt(p.id) || 0)) + 1),
      student_id: form.student_id,
      amount: form.amount,
      due_date: form.due_date,
      status: "pending" as const,
      paid_date: null,
    };

    data.payments = [...payments, newPayment];
    await setFirebaseData(data);
    
    toast({ title: "Mensalidade registrada!" });
    setOpen(false);
    setForm({ student_id: "", amount: "", due_date: "" });
    fetchData(); // Refresh all data
  };

  const handleMarkPaid = async (id: string) => {
    const data = await getFirebaseData();
    const payments = Object.values(data.payments || {});
    const paymentIndex = payments.findIndex((p: any) => p.id === id);

    if (paymentIndex !== -1) {
      const payment = payments[paymentIndex] as any;
      payment.status = "paid";
      payment.paid_date = new Date().toISOString().split("T")[0];
      
      // Adicionar notificação automática para o aluno
      let notifications = Object.values(data.notifications || {});
      const amount = Number(payment.amount).toFixed(2).replace(".", ",");
      const dueDate = format(new Date(payment.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR });
      
      // Limpar avisos antigos de cobrança para não confundir o aluno
      notifications = notifications.filter((n: any) => 
        !(n.student_id === payment.student_id && (n.title === "Lembrete de Cobrança" || n.title === "Cobrança de Mensalidade"))
      );

      notifications.push({
        id: Date.now().toString(),
        student_id: payment.student_id,
        title: "Pagamento Confirmado! ✅",
        description: `Seu pagamento de R$ ${amount} referente ao vencimento ${dueDate} foi aprovado pelo gestor.`,
        created_at: new Date().toISOString()
      });
      data.notifications = notifications;

      // Remover o comprovante se existir
      data.paymentProofs = Object.values(data.paymentProofs || {}).filter((pr: any) => pr.paymentId !== id);

      await setFirebaseData(data);
      toast({ title: "Pagamento confirmado!" });
      fetchData(); // Refresh all data
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (confirm("Tem certeza que deseja deletar esta mensalidade?")) {
      const data = await getFirebaseData();
      data.payments = Object.values(data.payments || {}).filter((p: any) => p.id !== id);
      await setFirebaseData(data);
      toast({ title: "Mensalidade deletada" });
      fetchData();
    }
  };

  const handleEditPayment = (payment: any) => {
    setEditingPaymentId(payment.id);
    setEditingValues({
      amount: payment.amount,
      due_date: payment.due_date,
    });
  };

  const handleSaveEdit = async (paymentId: string) => {
    const data = await getFirebaseData();
    const payments = Object.values(data.payments || {});
    const paymentIndex = payments.findIndex((p: any) => p.id === paymentId);
    if (paymentIndex !== -1) {
      (payments[paymentIndex] as any).amount = editingValues.amount;
      (payments[paymentIndex] as any).due_date = editingValues.due_date;
      await setFirebaseData(data);
      setEditingPaymentId(null);
      toast({ title: "Mensalidade atualizada!" });
      fetchData();
    }
  };

  const handleSendSystemNotification = async (payment: any) => {
    const amount = Number(payment.amount).toFixed(2).replace(".", ",");
    const dueDate = format(new Date(payment.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR });
    
    const data = await getFirebaseData();
    const notifications = Object.values(data.notifications || {});
    
    const newNotification = {
      id: Date.now().toString(),
      student_id: payment.student_id,
      payment_id: payment.id,
      title: "Lembrete de Cobrança",
      description: `Sua mensalidade no valor de R$ ${amount} vence em ${dueDate}. Verifique a aba de Mensalidades para fazer o pagamento.`,
      created_at: new Date().toISOString()
    };

    notifications.push(newNotification);
    data.notifications = notifications;
    await setFirebaseData(data);
    toast({ title: "Aluno notificado!", description: "A notificação foi enviada para a área do aluno." });
  };

  const statusLabel: Record<string, string> = { pending: "Pendente", paid: "Pago", overdue: "Vencido" };
  const statusClass: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    paid: "bg-success/10 text-success border-success/20",
    overdue: "bg-overdue/10 text-overdue border-overdue/20",
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const today = startOfDay(new Date());
  const limitDate = addDays(today, 3);
  
  const displayedPayments = (showAll
    ? allPayments
    : allPayments.filter((p: any) => {
        const dueDate = startOfDay(new Date(p.due_date + "T12:00:00"));
        return dueDate <= limitDate;
      })).filter((p: any) => 
        p.students?.full_name?.toLowerCase().includes(search.toLowerCase())
      );

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
                onClick={() => handleCreatePayment()}
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome do aluno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-card-foreground">
              {showAll ? "Todas as Mensalidades Pendentes" : "Próximos Vencimentos e Atrasos"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {showAll ? "Exibindo todas as mensalidades não pagas." : "Exibindo mensalidades vencidas, de hoje ou que vencem em até 3 dias."}
            </p>
          </div>
          <Button variant={showAll ? "default" : "outline"} size="sm" onClick={() => setShowAll(!showAll)} className="gap-2 transition-all shadow-sm">
            {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAll ? "Ocultar Distantes" : "Ver Todas"}
          </Button>
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
            displayedPayments?.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhuma mensalidade para exibir.</td></tr>
            ) : (
              displayedPayments?.map((p) => {
                const proof = proofs.find((pr: any) => pr.paymentId === p.id);
                return (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{p.students?.full_name || "Aluno Desconhecido"}</td>
                  <td className="p-4 text-sm text-card-foreground">
                    {editingPaymentId === p.id ? (
                      <Input 
                        type="number" 
                        step="0.01"
                        value={editingValues.amount}
                        onChange={(e) => setEditingValues({...editingValues, amount: e.target.value})}
                        className="w-32"
                      />
                    ) : (
                      `R$ ${Number(p.amount).toFixed(2)}`
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {editingPaymentId === p.id ? (
                      <Input 
                        type="date"
                        value={editingValues.due_date}
                        onChange={(e) => setEditingValues({...editingValues, due_date: e.target.value})}
                        className="w-40"
                      />
                    ) : (
                      format(new Date(p.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })
                    )}
                  </td>
                  <td className="p-4">
                    <Badge className={statusClass[p.status]}>{statusLabel[p.status]}</Badge>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {editingPaymentId === p.id ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleSaveEdit(p.id)} className="text-success hover:text-success">
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingPaymentId(null)}>
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                    {proof && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-blue-500 hover:text-blue-600 border-blue-200 hover:bg-blue-500/10">
                            <Eye className="w-4 h-4 mr-1" /> Comprovante
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader><DialogTitle>Comprovante - {p.students?.full_name || "Aluno"}</DialogTitle></DialogHeader>
                          <div className="mt-4 flex flex-col items-center gap-4">
                            {proof.isCash ? (
                              <div className="bg-muted p-8 rounded-lg text-center w-full border border-border">
                                <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-lg font-medium text-foreground">Pagamento em Dinheiro</p>
                                <p className="text-sm text-muted-foreground mt-2">O aluno informou que o pagamento foi realizado presencialmente em dinheiro.</p>
                              </div>
                            ) : proof.fileData?.startsWith("data:application/pdf") ? (
                              <iframe src={proof.fileData} className="w-full h-96 border rounded" />
                            ) : (
                              <img src={proof.fileData} alt="Comprovante" className="max-w-full max-h-96 object-contain rounded" />
                            )}
                            {p.status !== "paid" && (
                              <Button onClick={() => handleMarkPaid(p.id)} className="w-full bg-success hover:bg-success/90 text-white">
                                Aprovar Pagamento
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                        {p.status !== "paid" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleSendSystemNotification(p)} className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                              <MessageCircle className="w-4 h-4 mr-1" /> Notificar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEditPayment(p)} className="text-primary hover:text-primary hover:bg-primary/10">
                              <Edit2 className="w-4 h-4 mr-1" /> Editar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleMarkPaid(p.id)} className="text-success hover:text-success hover:bg-success/10">
                              <Check className="w-4 h-4 mr-1" /> Confirmar
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDeletePayment(p.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4 mr-1" /> Deletar
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
                );
              })
            )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
