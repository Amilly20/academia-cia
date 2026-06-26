import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Loader2, Camera } from "lucide-react";
import { getFirebaseData, setFirebaseData, generateStudentPayments, generateAutomaticNotifications, uploadBase64ToStorage, uploadFileToStorage, compressImage } from "@/lib/localStorage";
import { StudentAnnouncements, StudentBirthdays, StudentEvents, StudentLostFound, StudentNotifications, StudentPayments } from "@/components/student-area-components";

export default function StudentArea() {
  const [uniqueCode, setUniqueCode] = useState("");
  const [loggedInStudent, setLoggedInStudent] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [lostFoundItems, setLostFoundItems] = useState<any[]>([]);
  const [myNotifications, setMyNotifications] = useState<any[]>([]);
  const [paymentProofs, setPaymentProofs] = useState<any[]>([]);
  const [pixKey, setPixKey] = useState("00074814540");
  const [dialogOpenStates, setDialogOpenStates] = useState<Record<string, boolean>>({});

  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const [isChatOpen, setIsChatOpen] = useState(false);

  const loadStudentData = async (student: any, allData: any) => {
    let currentData = allData;
    
    // Roda o gerador automático para garantir que as mensalidades do mês atual existam
    const studentsArray = Object.values(currentData.students || {});
    const paymentsArray = Object.values(currentData.payments || {});
    
    const updatedPayments = generateStudentPayments(studentsArray, paymentsArray);
    let needsUpdate = false;
    if (updatedPayments.length > paymentsArray.length) {
      currentData.payments = updatedPayments;
      needsUpdate = true;
    }
    if (generateAutomaticNotifications(currentData)) {
      needsUpdate = true;
    }
    if (needsUpdate) {
      await setFirebaseData(currentData);
    }

    setLoggedInStudent(student);

    const payments = Object.values(currentData.payments || {})
      .filter((p: any) => p.student_id === student.id && p.status !== "paid" && p.status !== "archived")
      .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    setMyPayments(payments);

    setAnnouncements(Object.values(currentData.announcements || {}));
    const events = Object.values(currentData.events || {}).sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    setUpcomingEvents(events);

    const lostItems = Object.values(currentData.lostAndFound || {}).filter((item: any) => !item.claimed).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setLostFoundItems(lostItems);

    const studentNotifications = Object.values(currentData.notifications || {}).filter((n: any) => n.student_id === student.id).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setMyNotifications(studentNotifications);

    setPaymentProofs(Object.values(currentData.paymentProofs || {}));
    
    const messages = Object.values(currentData.messages || {}).filter((m: any) => m.student_id === student.id).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setChatMessages(messages);
    
    setPixKey((currentData.settings?.PIX_KEY && currentData.settings.PIX_KEY !== "12.345.678/0001-90") ? currentData.settings.PIX_KEY : "00074814540");
  };

  useEffect(() => {
    const checkSession = async () => {
      const savedUniqueCode = localStorage.getItem("studentUniqueCode");
      if (savedUniqueCode) {
        const allData = await getFirebaseData();
        const student = Object.values(allData.students || {}).find((s: any) => s.unique_code === savedUniqueCode && s.status === "active");
        if (student) {
          await loadStudentData(student, allData);
        } else {
          localStorage.removeItem("studentUniqueCode");
          toast({ title: "Sessão expirada", description: "Seu código de acesso não é mais válido ou sua conta está inativa. Por favor, faça login novamente.", variant: "destructive" });
        }
      }
      setLoading(false);
    };

    checkSession();
    
    window.addEventListener('focus', checkSession);
    window.addEventListener('storage', checkSession);
    return () => {
      window.removeEventListener('focus', checkSession);
      window.removeEventListener('storage', checkSession);
    };
  }, [navigate, location.state]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const allData = await getFirebaseData();
      const inputCode = uniqueCode.trim(); // Remove espaços acidentais no início ou no final
      const student = Object.values(allData.students || {}).find((s: any) => 
        (s.unique_code === inputCode || s.password === inputCode) && s.status === "active"
      );
      
      if (student) {
        localStorage.setItem("studentUniqueCode", student.unique_code);
        await loadStudentData(student, allData);
        toast({ title: "Login bem-sucedido!", description: "Bem-vindo de volta!" });
      } else {
        toast({ title: "Conta não encontrada", description: "Verifique se você digitou corretamente, respeitando letras MAIÚSCULAS e minúsculas, e sem espaços no final.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      toast({ title: "Erro no Login", description: "Erro ao fazer login. Verifique suas credenciais.", variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const data = await getFirebaseData();
    const notificationsArray = Object.values(data.notifications || {});
    data.notifications = notificationsArray.filter((n: any) => n.id !== id);
    await setFirebaseData(data);
    setMyNotifications(prev => prev.filter(n => n.id !== id));
    toast({ title: "Notificação excluída" });
  };

  const handlePaymentSubmission = async (p: any, proofObj: any) => {
    const data = await getFirebaseData();
    const settings = data.settings || {};
    
    // Salva o comprovante (caso o gestor queira consultar no futuro)
    const proofs = data.paymentProofs || [];
    proofs.push(proofObj);
    data.paymentProofs = proofs;

    if (!proofObj.isCash) {
      // Dá a baixa automática na mensalidade se enviou comprovante
      const payments = Object.values(data.payments || {});
      const paymentIndex = payments.findIndex((pay: any) => pay.id === p.id);
      
      if (paymentIndex !== -1) {
        const payment = payments[paymentIndex] as any;
        payment.status = "paid";
        payment.paid_date = new Date().toISOString().split("T")[0];

        // Envia a notificação de sucesso pro aluno
        let notifications = Object.values(data.notifications || {});
        const amount = Number(payment.amount).toFixed(2).replace(".", ",");
        const dueDate = format(new Date(payment.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR });
        
        notifications = notifications.filter((n: any) => 
          !(n.student_id === payment.student_id && (n.title === "Lembrete de Cobrança" || n.title === "Cobrança de Mensalidade"))
        );

        notifications.push({
          id: Date.now().toString(),
          student_id: payment.student_id,
          title: "Pagamento Confirmado! ✅",
          description: `Seu pagamento de R$ ${amount} referente ao vencimento ${dueDate} foi baixado com sucesso no sistema.`,
          created_at: new Date().toISOString()
        });
        data.notifications = notifications;
        data.payments = payments;
      }

      // Roda o gerador de mensalidades DE NOVO para garantir que a do próximo mês seja criada
      const studentsArray = Object.values(data.students || {});
      const currentPaymentsArray = Object.values(data.payments || {});
      const updatedPayments = generateStudentPayments(studentsArray, currentPaymentsArray);
      if (updatedPayments.length > currentPaymentsArray.length) {
        data.payments = updatedPayments;
      }
      // Fim da adição

      await setFirebaseData(data);
      setPaymentProofs(proofs);
      setMyPayments(prev => prev.filter((pay: any) => pay.id !== p.id));
      
      toast({ 
        title: "Pagamento Confirmado!", 
        description: "Sua mensalidade foi baixada automaticamente pelo sistema."
      });
    } else {
      // Se for dinheiro, só salva o aviso e espera aprovação manual
      await setFirebaseData(data);
      setPaymentProofs(proofs);
      setMyPayments(prev => prev.filter((pay: any) => pay.id !== p.id));
      
      toast({ 
        title: "Aviso Enviado!", 
        description: "O gestor foi notificado e dará a baixa na sua mensalidade."
      });
    }

    // Dispara o Webhook (Make.com) de forma invisível para o usuário
    if (settings.webhookUrl) {
      try {
        const payload = {
          event: "payment_submitted",
          student: {
            id: loggedInStudent.id,
            name: loggedInStudent.full_name,
            phone: loggedInStudent.phone,
          },
          payment: {
            id: p.id,
            amount: p.amount,
            dueDate: p.due_date,
            isCash: proofObj.isCash || false
          }
        };
        fetch(settings.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(e => console.error("Webhook error:", e));
      } catch (err) {
        console.error("Failed to send webhook", err);
      }
    }

    // Dispara notificação via Telegram (Instântaneo e Gratuito)
    if (settings.telegramToken && settings.telegramChatId) {
      try {
        const amountStr = Number(p.amount).toFixed(2).replace(".", ",");
        const message = `💰 *Novo Pagamento!*\n\nO aluno *${loggedInStudent.full_name}* informou um pagamento de *R$ ${amountStr}*.`;
        const url = `https://api.telegram.org/bot${settings.telegramToken}/sendMessage?chat_id=${settings.telegramChatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;
        
        fetch(url).catch(e => console.error("Telegram error:", e));
      } catch (err) {
        console.error("Failed to send Telegram notification", err);
      }
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        toast({ title: "Fazendo upload..." });
        const compressedData = await compressImage(file);
        const newImageUrl = await uploadBase64ToStorage(compressedData);
        setLoggedInStudent((prev: any) => ({ ...prev, profile_picture_url: newImageUrl }));
        toast({ title: "Foto de perfil atualizada!" });

        const data = await getFirebaseData();
        const studentsArray = Object.values(data.students || {});
        const studentIndex = studentsArray.findIndex((s: any) => s.id === loggedInStudent.id);
        if (studentIndex !== -1) {
          (studentsArray[studentIndex] as any).profile_picture_url = newImageUrl;
          data.students = studentsArray;
          await setFirebaseData(data);
        }
      } catch (error) {
        toast({ title: "Erro", description: error.message || "Erro ao salvar a foto", variant: "destructive" });
      }
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("studentUniqueCode");
    setLoggedInStudent(null);
    setMyPayments([]);
    setAnnouncements([]);
    setUpcomingEvents([]);
    setLostFoundItems([]);
    setMyNotifications([]);
    setPaymentProofs([]);
    setChatMessages([]);
    toast({ title: "Desconectado", description: "Você saiu da sua conta." });
    navigate("/");
  };

  if (!loggedInStudent) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-card border border-border rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold font-heading text-center text-primary mb-6">Acesso do Aluno</h2>
        {loading ? (
          <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <Label htmlFor="uniqueCode">Código de Acesso</Label>
              <Input id="uniqueCode" type="text" placeholder="Digite seu código único" value={uniqueCode} onChange={(e) => setUniqueCode(e.target.value)} required />
              <Button type="submit" disabled={loginLoading} className="w-full gradient-primary text-primary-foreground border-0">
                {loginLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <img 
              src={loggedInStudent.profile_picture_url || `https://ui-avatars.com/api/?name=${loggedInStudent.full_name.replace(/\s/g, "+")}&background=random`} 
              alt="Foto de Perfil" 
              className="w-20 h-20 rounded-full object-cover border-2 border-primary"
            />
            <Label htmlFor="profile-picture-upload" className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6" />
            </Label>
            <Input id="profile-picture-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Olá, {loggedInStudent.full_name}!</h1>
            <p className="text-muted-foreground mt-1">Bem-vindo à sua Área do Aluno Cia fitness!</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout}>Sair</Button>
      </div>
      
      <StudentBirthdays />

      <StudentNotifications notifications={myNotifications} onDelete={handleDeleteNotification} />
      
      <StudentAnnouncements announcements={announcements} />
      
      <div className="grid md:grid-cols-2 gap-6">
        <StudentPayments
          payments={myPayments}
          proofs={paymentProofs}
          pixKey={pixKey}
          dialogOpenStates={dialogOpenStates}
          setDialogOpenStates={setDialogOpenStates}          
          handlePaymentSubmission={handlePaymentSubmission}
          chatMessages={chatMessages}
          uploadBase64ToStorage={uploadBase64ToStorage}
          uploadFileToStorage={uploadFileToStorage}
          loggedInStudent={loggedInStudent}
          setChatMessages={setChatMessages}
        />
        <StudentEvents events={upcomingEvents} />
      </div>

      <StudentLostFound items={lostFoundItems} />
    </div>
  );
}