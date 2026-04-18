import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { getFirebaseData, setFirebaseData, generatePassword } from "@/lib/localStorage";

const generateUniqueCode = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export default function StudentFormDialog({ onStudentCreated }: { onStudentCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", monthly_fee: "", birth_date: "", enrollment_date: new Date().toISOString().split('T')[0] });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Reset generatedCode when dialog is opened/closed
  useEffect(() => { 
    if (!open) {
      setGeneratedCode(null);
      setGeneratedPassword(null);
      setShowPassword(false);
    }
  }, [open]);

  const handleCreateStudent = async () => {
    setIsCreating(true);
    try {
      const cleanPhone = form.phone.replace(/\D/g, "");

      if (cleanPhone.length < 10) {
        throw new Error("Por favor, preencha o número de WhatsApp com DDD para concluir o cadastro.");
      }

      const data = await getFirebaseData();
      const students = Object.values(data.students || {});
      const payments = Object.values(data.payments || {});

      const uniqueCode = generateUniqueCode();
      const password = generatePassword();
      const studentId = String(Math.max(...students.map((s: any) => parseInt(s.id) || 0)) + 1);
      
      const newStudent = {
        id: studentId,
        full_name: form.full_name,
        phone: cleanPhone,
        monthly_fee: form.monthly_fee,
        birth_date: form.birth_date,
        enrollment_date: form.enrollment_date,
        unique_code: uniqueCode,
        password: password,
        status: "active",
        plans: { name: "Basic", price: parseFloat(form.monthly_fee) || 99 },
        profile_picture_url: null,
        joined_at: new Date().toISOString().split('T')[0],
      };

      // A primeira mensalidade vence 1 mês após a data base
      const baseDate = new Date(form.enrollment_date + "T12:00:00");
      const dueDate = new Date(baseDate);
      const originalDay = dueDate.getDate();
      dueDate.setMonth(dueDate.getMonth() + 1);
      if (dueDate.getDate() !== originalDay) {
        dueDate.setDate(0);
      }
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const newPayment = {
        id: String(Math.max(0, ...payments.map((p: any) => parseInt(p.id) || 0)) + 1),
        student_id: studentId,
        amount: form.monthly_fee,
        due_date: dueDateStr,
        status: "pending" as const,
        paid_date: null,
      };

      // Update arrays and save to localStorage
      data.students = [...students, newStudent];
      data.payments = [...payments, newPayment];
      
      await setFirebaseData(data);

      toast({ title: "Aluno cadastrado com sucesso!", description: "Código de acesso, senha e cobrança de 30 dias gerados." });
      setGeneratedCode(uniqueCode);
      setGeneratedPassword(password);
      setForm({ full_name: "", phone: "", monthly_fee: "", birth_date: "", enrollment_date: new Date().toISOString().split('T')[0] });
      onStudentCreated?.();
    } catch (error: any) {
      toast({ title: "Erro ao cadastrar aluno", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-primary text-primary-foreground border-0">
          <Plus className="w-4 h-4" /> Novo Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <DialogHeader><DialogTitle className="font-heading">Cadastrar Novo Aluno</DialogTitle></DialogHeader>
        {generatedCode ? (
          <div className="space-y-4 mt-4 text-center">
            <p className="text-lg font-semibold">Aluno cadastrado com sucesso!</p>
            <div className="space-y-3">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Código de acesso:</p>
                <p className="text-2xl font-bold text-primary">{generatedCode}</p>
                <Button size="sm" onClick={() => { navigator.clipboard.writeText(generatedCode); toast({ title: "Código copiado!" }); }} className="mt-2 gap-1" variant="outline">
                  <Copy className="w-3 h-3" /> Copiar Código
                </Button>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-muted-foreground text-sm mb-1">Senha:</p>
                <div className="flex items-center gap-2 justify-center">
                  <p className="text-2xl font-bold text-primary font-mono">{showPassword ? generatedPassword : '•'.repeat(generatedPassword?.length || 0)}</p>
                  <Button size="sm" variant="ghost" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button size="sm" onClick={() => { navigator.clipboard.writeText(generatedPassword || ''); toast({ title: "Senha copiada!" }); }} className="mt-2 gap-1 w-full" variant="outline">
                  <Copy className="w-3 h-3" /> Copiar Senha
                </Button>
              </div>
            </div>
            <Button variant="outline" onClick={() => { setGeneratedCode(null); setGeneratedPassword(null); setOpen(false); }} className="w-full">Fechar</Button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleCreateStudent(); }} className="space-y-4 mt-4">
            <div><Label>Nome Completo</Label><Input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
            <div><Label>Telefone (WhatsApp)</Label><Input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Ex: 11999999999" /></div>
            <div><Label>Valor da Mensalidade (R$)</Label><Input type="number" step="0.01" placeholder="Ex: 99.90" required value={form.monthly_fee} onChange={e => setForm({...form, monthly_fee: e.target.value})} /></div>
            <div><Label>Data de Nascimento</Label><Input type="date" required value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} /></div>
            <div><Label>Data de Matrícula</Label><Input type="date" required value={form.enrollment_date} onChange={e => setForm({...form, enrollment_date: e.target.value})} /></div>
            <Button type="submit" disabled={isCreating || !form.full_name || !form.phone || !form.monthly_fee || !form.birth_date || !form.enrollment_date} className="w-full gradient-primary text-primary-foreground border-0">
              {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : "Cadastrar Aluno e Gerar Código"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}