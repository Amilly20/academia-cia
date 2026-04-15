import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { auth, db, googleProvider } from "@/integrations/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function StudentArea() {
  const [phone, setPhone] = useState("");
  const [loggedInStudent, setLoggedInStudent] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) checkGoogleUser(user.email);
    });

    const savedPhone = localStorage.getItem("studentPhone");
    if (savedPhone) {
      checkPhoneUser(savedPhone);
    }

    return () => unsubscribe();
  }, []);

  const checkGoogleUser = async (email: string) => {
    const q = query(collection(db, "students"), where("email", "==", email), where("status", "==", "active"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) setLoggedInStudent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
    else {
      alert("Conta não encontrada. Você será redirecionado para concluir o cadastro.");
      navigate("/cadastro");
    }
  };

  const checkPhoneUser = async (phoneStr: string) => {
    const q = query(collection(db, "students"), where("phone", "==", phoneStr), where("status", "==", "active"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) setLoggedInStudent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
    else localStorage.removeItem("studentPhone");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    const q = query(collection(db, "students"), where("phone", "==", cleanPhone), where("status", "==", "active"));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      setLoggedInStudent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      localStorage.setItem("studentPhone", cleanPhone);
    } else {
      alert("Aluno não encontrado. Verifique se o telefone está correto.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    setLoggedInStudent(null);
    localStorage.removeItem("studentPhone");
    signOut(auth);
  };

  const { data: myPayments } = useQuery({
    queryKey: ["my-payments", loggedInStudent?.id],
    enabled: !!loggedInStudent?.id,
    queryFn: async () => {
      const q = query(collection(db, "payments"), where("student_id", "==", loggedInStudent.id));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return data.sort((a: any, b: any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
    }
  });

  if (!loggedInStudent) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-card border border-border rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold font-heading text-center text-primary mb-6">Acesso do Aluno</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Digite seu Telefone cadastrado</label>
            <Input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 11999999999" />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0">Entrar</Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Ou</span></div>
        </div>

        <Button variant="outline" onClick={handleGoogleLogin} className="w-full gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Entrar com Google
        </Button>
      </div>
    );
  }

  const statusLabel: Record<string, string> = { pending: "Pendente", paid: "Pago", overdue: "Vencido" };
  const statusClass: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    paid: "bg-success/10 text-success border-success/20",
    overdue: "bg-overdue/10 text-overdue border-overdue/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Olá, {loggedInStudent.full_name}!</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo à sua Área do Aluno Cia fitness.</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>Sair</Button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-heading font-semibold text-primary mb-4">Suas Mensalidades</h3>
          {!myPayments?.length ? <p className="text-sm text-muted-foreground">Nenhuma cobrança registrada.</p> : (
            <div className="space-y-4">
              {myPayments.map(p => (
                <div key={p.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0">
                  <div><p className="font-medium">R$ {Number(p.amount).toFixed(2)}</p><p className="text-xs text-muted-foreground">Vencimento: {format(new Date(p.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</p></div>
                  <Badge className={statusClass[p.status]}>{statusLabel[p.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-heading font-semibold text-primary mb-2">Avisos e Treinos</h3>
          <p className="text-sm text-muted-foreground">Sua ficha de treino será disponibilizada aqui em breve. Fique de olho!</p>
        </div>
      </div>
    </div>
  );
}