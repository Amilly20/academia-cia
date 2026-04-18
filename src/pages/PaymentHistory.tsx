import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getFirebaseData } from "@/lib/localStorage";
import { Search, Loader2 } from "lucide-react";

export default function PaymentHistory() {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getFirebaseData();
      const studentsData = Object.values(data.students || {});
      const paymentsData = Object.values(data.payments || {});

      const paidPayments = paymentsData
        .filter((p: any) => p.status === "paid")
        .map((payment: any) => {
          const student = studentsData.find((s: any) => s.id === payment.student_id);
          return {
            ...payment,
            studentName: student ? student.full_name : "Aluno Desconhecido",
          };
        })
        .sort((a: any, b: any) => a.studentName.localeCompare(b.studentName));

      setPayments(paidPayments);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const filteredPayments = payments.filter(p =>
    p.studentName.toLowerCase().includes(search.toLowerCase())
  );

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

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Aluno</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Valor Pago</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data de Vencimento</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data do Pagamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></td></tr>
            ) : !filteredPayments.length ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum pagamento encontrado.</td></tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-card-foreground">{p.studentName}</td>
                  <td className="p-4 text-sm text-success">R$ {Number(p.amount).toFixed(2)}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(new Date(p.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {p.paid_date ? format(new Date(p.paid_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
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