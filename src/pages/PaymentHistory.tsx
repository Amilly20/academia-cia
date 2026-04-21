import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getFirebaseData } from "@/lib/localStorage";
import { Search, Loader2, Eye, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PaymentHistory() {
  const [payments, setPayments] = useState<any[]>([]);
  const [proofs, setProofs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getFirebaseData();
      const studentsData = Object.values(data.students || {});
      const paymentsData = Object.values(data.payments || {});
      const proofsData = Object.values(data.paymentProofs || {});

      const paidPayments = paymentsData
        .filter((p: any) => p.status === "paid")
        .map((payment: any) => {
          const student = studentsData.find((s: any) => s.id === payment.student_id);
          return {
            ...payment,
            studentName: student ? student.full_name : "Aluno Desconhecido",
          };
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.paid_date || a.due_date).getTime();
          const dateB = new Date(b.paid_date || b.due_date).getTime();
          return dateB - dateA; // Ordena do mais recente para o mais antigo
        });

      setPayments(paidPayments);
      setProofs(proofsData);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const filteredPayments = payments.filter(p =>
    p.studentName.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupar pagamentos por mês
  const groupedPayments = filteredPayments.reduce((acc: any, p: any) => {
    const dateToUse = p.paid_date ? p.paid_date + "T12:00:00" : p.due_date + "T12:00:00";
    const monthYear = format(new Date(dateToUse), "MMMM 'de' yyyy", { locale: ptBR });
    const capitalizedMonth = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    
    if (!acc[capitalizedMonth]) acc[capitalizedMonth] = [];
    acc[capitalizedMonth].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Histórico de Pagamentos</h1>
        <p className="text-muted-foreground mt-1">Visualize todos os pagamentos recebidos.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome do aluno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !filteredPayments.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Nenhum pagamento encontrado.
        </div>
      ) : (
        Object.entries(groupedPayments).map(([month, monthPayments]) => (
          <div key={month} className="mb-8">
            <div className="flex items-center gap-3 mb-4 border-b border-border pb-2">
              <h2 className="text-xl font-bold font-heading text-primary">{month}</h2>
              <Badge variant="secondary" className="font-normal">{monthPayments.length} pagamentos</Badge>
            </div>
            
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Aluno</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Valor Pago</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Vencimento</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data Pagamento</th>
                    <th className="text-center p-4 text-sm font-medium text-muted-foreground">Comprovante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {monthPayments.map((p: any) => {
                    const proof = proofs.find((pr: any) => pr.paymentId === p.id);
                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium text-card-foreground">{p.studentName}</td>
                        <td className="p-4 text-sm text-success font-medium">R$ {Number(p.amount).toFixed(2)}</td>
                        <td className="p-4 text-sm text-muted-foreground">{format(new Date(p.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</td>
                        <td className="p-4 text-sm text-muted-foreground font-medium">{p.paid_date ? format(new Date(p.paid_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</td>
                        <td className="p-4 text-center">
                          {proof ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-blue-500 hover:text-blue-600 border-blue-200 hover:bg-blue-500/10">
                                  <Eye className="w-4 h-4 mr-1" /> Ver
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader><DialogTitle>Comprovante - {p.studentName}</DialogTitle></DialogHeader>
                                <div className="mt-4 flex flex-col items-center gap-4">
                                  {proof.isCash ? (
                                    <div className="bg-muted p-8 rounded-lg text-center w-full border border-border">
                                      <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                      <p className="text-lg font-medium text-foreground">Pagamento em Dinheiro</p>
                                      <p className="text-sm text-muted-foreground mt-2">Este pagamento foi recebido presencialmente em dinheiro.</p>
                                    </div>
                                  ) : proof.fileData?.startsWith("data:application/pdf") ? (
                                    <iframe src={proof.fileData} className="w-full h-96 border rounded" />
                                  ) : (
                                    <img src={proof.fileData} alt="Comprovante" className="max-w-full max-h-96 object-contain rounded" />
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : <span className="text-xs text-muted-foreground">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}