import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, AlertCircle, Calendar, Users, Package, CreditCard, CheckCircle, Upload, MessageCircle, Loader2, Trash2, Camera, Wallet, Send } from "lucide-react";
import { getFirebaseData, setFirebaseData, generateStudentPayments, generateAutomaticNotifications } from "@/lib/localStorage";

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
  const [birthdaysToday, setBirthdaysToday] = useState<any[]>([]);
  const [myNotifications, setMyNotifications] = useState<any[]>([]);
  const [paymentProofs, setPaymentProofs] = useState<any[]>([]);
  const [pixKey, setPixKey] = useState("00074814540");
  const [pendingProofs, setPendingProofs] = useState<Record<string, any>>({});

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Calculate age from birth date (approximate)
  const calculateBirthdaysToday = (students: any[]) => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    return students.filter((student: any) => {
      if (!student.birth_date) return false;
      const [, month, day] = student.birth_date.split('-');
      return parseInt(month) === todayMonth && parseInt(day) === todayDay;
    });
  };

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

    const todayBirthdays = calculateBirthdaysToday(Object.values(currentData.students || {}));
    setBirthdaysToday(todayBirthdays);

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
      }

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
  };

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newImageUrl = reader.result as string;
        setLoggedInStudent(prev => ({ ...prev, profile_picture_url: newImageUrl }));
        toast({ title: "Foto de perfil atualizada!" });

        try {
          const data = await getFirebaseData();
          const studentsArray = Object.values(data.students || {});
          const studentIndex = studentsArray.findIndex((s: any) => s.id === loggedInStudent.id);
          if (studentIndex !== -1) {
            (studentsArray[studentIndex] as any).profile_picture_url = newImageUrl;
            data.students = studentsArray;
            await setFirebaseData(data);
          }
        } catch (error) {
          toast({ title: "Erro ao salvar a foto", variant: "destructive" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("studentUniqueCode");
    setLoggedInStudent(null);
    setMyPayments([]);
    setAnnouncements([]);
    setUpcomingEvents([]);
    setLostFoundItems([]);
    setBirthdaysToday([]);
    setMyNotifications([]);
    setPaymentProofs([]);
    setChatMessages([]);
    toast({ title: "Desconectado", description: "Você saiu da sua conta." });
    navigate("/");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !loggedInStudent) return;

    try {
      const data = await getFirebaseData();
      const messages = Object.values(data.messages || {});
      
      const newMsg = {
        id: String(Date.now()),
        student_id: loggedInStudent.id,
        sender: 'student',
        text: newMessage,
        created_at: new Date().toISOString(),
        read: false,
      };
      
      messages.push(newMsg);
      data.messages = messages;
      await setFirebaseData(data);
      
      setChatMessages(prev => [...prev, newMsg]);
      setNewMessage("");
    } catch (error) {
      toast({ title: "Erro ao enviar mensagem", variant: "destructive" });
    }
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

  const statusLabel: Record<string, string> = { pending: "Pendente", paid: "Pago", overdue: "Vencido" };
  const statusClass: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    paid: "bg-success/10 text-success border-success/20",
    overdue: "bg-overdue/10 text-overdue border-overdue/20",
  };

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
            <p className="text-muted-foreground mt-1">Bem-vindo à sua Área do Aluno Cia fitness.</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout}>Sair</Button>
      </div>
      
      {/* Birthdays Section */}
      {birthdaysToday.length > 0 && (
        <div className="rounded-xl border border-success/20 bg-success/5 p-6">
          <div className="flex items-center gap-2 text-success mb-4">
            <Users className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Aniversariantes do Dia!</h3>
          </div>
          <div className="space-y-3">
            {birthdaysToday.map(person => (
              <div 
                key={person.id}
                className="p-3 rounded-lg border-2 border-success/20 bg-success/5"
              >
                <p className="text-sm font-medium text-foreground">
                  🎉 {person.full_name} está fazendo aniversário hoje! Parabéns, Feliz Aniversário!
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Notifications Section */}
      {myNotifications.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-primary mb-4">
            <MessageCircle className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Suas Notificações</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {myNotifications.map((notif: any) => (
              <div key={notif.id} className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm relative group">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteNotification(notif.id)}
                  title="Excluir notificação"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <p className="font-medium text-foreground text-sm pr-8">{notif.title}</p>
                <p className="text-muted-foreground text-xs mt-1">{notif.description || notif.message}</p>
                {notif.created_at && (
                  <p className="text-xs text-muted-foreground mt-2 font-semibold">
                    📅 {format(new Date(notif.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Announcements Section */}
      {announcements.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-warning mb-4">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Avisos do Gestor</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {announcements.map((ann: any) => (
              <div key={ann.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {ann.image_url && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <img src={ann.image_url} alt={ann.title} className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-2 bg-transparent border-0 shadow-none">
                      <img src={ann.image_url} alt={ann.title} className="max-w-full max-h-[90vh] rounded-md object-contain mx-auto" />
                    </DialogContent>
                  </Dialog>
                )}
                <div className="p-4">
                  <p className="font-medium text-foreground text-sm">{ann.title}</p>
                  <p className="text-muted-foreground text-xs mt-2">{ann.description}</p>
                  {ann.created_at && (
                    <p className="text-xs text-muted-foreground mt-3">
                      📅 {format(new Date(ann.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-heading font-semibold text-primary">Suas Mensalidades</h3>
            </div>
            
            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageCircle className="w-4 h-4" /> Falar com Gestor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] h-[500px] flex flex-col">
                <DialogHeader>
                  <DialogTitle className="font-heading">Chat com Gestor</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-4 p-2 pr-4 mt-4">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground mt-10">Nenhuma mensagem ainda. Envie uma mensagem para o gestor!</p>
                  ) : (
                    chatMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 ${msg.sender === 'student' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-[10px] opacity-70 mt-1 text-right">
                            {format(new Date(msg.created_at), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-border mt-auto">
                  <Input 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} 
                    placeholder="Digite sua mensagem..." 
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim()} size="icon" className="shrink-0"><Send className="w-4 h-4" /></Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {!myPayments?.length ? (
            <p className="text-sm text-muted-foreground">Você não possui mensalidades pendentes.</p>
          ) : (
            <div className="space-y-4">
              {myPayments.map((p: any) => {
                const dueDate = new Date(p.due_date + "T12:00:00");
                const isDueToday = isToday(dueDate);
                const isOverdue = new Date() > dueDate && p.status !== "paid";
                
                return (
                  <div 
                    key={p.id} 
                    className={`rounded-lg p-4 border-2 transition-all ${
                      isDueToday || isOverdue
                        ? "border-overdue/50 bg-overdue/5"
                        : p.status === "paid"
                        ? "border-success/50 bg-success/5"
                        : "border-border bg-background/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg text-foreground">R$ {Number(p.amount).toFixed(2)}</p>
                        <p className={`text-sm mt-1 ${isDueToday ? "font-bold text-overdue" : isOverdue ? "font-bold text-overdue" : "text-muted-foreground"}`}>
                          📅 Vencimento: {format(dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          {isDueToday && " ⚠️ VENCE HOJE!"}
                          {isOverdue && " ⚠️ VENCIDO!"}
                        </p>
                      </div>
                      {p.status === "paid" ? (
                        <Badge className="bg-success/10 text-success border-success/20 gap-1">
                          <CheckCircle className="w-3 h-3" /> Pago
                        </Badge>
                      ) : (
                        <Badge className={isDueToday || isOverdue ? "bg-overdue/10 text-overdue border-overdue/20" : "bg-warning/10 text-warning border-warning/20"}>
                          Pendente
                        </Badge>
                      )}
                    </div>

                    {p.status !== "paid" && (
                      paymentProofs.some((pr: any) => pr.paymentId === p.id) ? (() => {
                        const proof = paymentProofs.find((pr: any) => pr.paymentId === p.id);
                        return (
                          <div className="bg-blue-500/10 text-blue-500 text-sm font-medium p-3 rounded-lg flex items-center justify-center gap-2 mt-2 border border-blue-500/20">
                            <CheckCircle className="w-4 h-4" /> {proof.isCash ? "Pagamento em análise" : "Comprovante em análise"}
                          </div>
                        );
                      })() : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full gap-2 gradient-primary text-primary-foreground border-0 mb-2">
                            <CreditCard className="w-4 h-4" /> Pagar Agora
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card max-w-md">
                          <DialogHeader>
                            <DialogTitle className="font-heading">Pagamento de Mensalidade</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            <div className="bg-muted/50 p-4 rounded-lg border border-border">
                              <p className="text-sm text-muted-foreground mb-2">Valor a Pagar:</p>
                              <p className="text-2xl font-bold text-foreground">R$ {Number(p.amount).toFixed(2)}</p>
                            </div>

                            <div>
                              <Label className="text-base font-semibold mb-3 block">Chave PIX</Label>
                              <div className="flex items-center gap-2">
                                <Input 
                                  readOnly 
                                  value={pixKey} 
                                  className="flex-1 font-mono" 
                                />
                                <Button 
                                  size="icon" 
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(pixKey);
                                    toast({ title: "PIX copiado!", description: "Chave PIX foi copiada para a área de transferência." });
                                  }}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">💡 Copie a chave e abra seu banco para fazer a transferência PIX</p>
                            </div>

                            <div>
                              <Label className="text-base font-semibold mb-3 block">Enviar Comprovante</Label>
                              <Input 
                                type="file" 
                                accept="image/*,.pdf" 
                                className="cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      // Store proof of payment
                                      const proof = {
                                        paymentId: p.id,
                                        fileName: file.name,
                                        fileData: reader.result,
                                        uploadedAt: new Date().toISOString(),
                                      };
                                  setPendingProofs(prev => ({
                                    ...prev,
                                    [p.id]: proof
                                  }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                          <p className="text-xs text-muted-foreground mt-2">📎 Faça uma captura de tela ou tire uma foto do comprovante e selecione-o acima</p>
                          
                          {pendingProofs[p.id] && (
                            <Button 
                              className="w-full mt-4 bg-success hover:bg-success/90 text-white gap-2"
                              onClick={() => {
                                handlePaymentSubmission(p, pendingProofs[p.id]);
                                setPendingProofs(prev => {
                                  const next = {...prev};
                                  delete next[p.id];
                                  return next;
                                });
                              }}
                            >
                              <Upload className="w-4 h-4" /> Enviar Comprovante Selecionado
                            </Button>
                          )}
                            </div>

                            <div className="relative my-4">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Ou</span>
                              </div>
                            </div>

                            <div>
                              <Label className="text-base font-semibold mb-3 block">Pagamento em Dinheiro</Label>
                              <Button 
                                variant="outline" 
                                className="w-full gap-2"
                                onClick={() => {
                                  const proof = {
                                    paymentId: p.id,
                                    fileName: "Pagamento em Dinheiro",
                                    fileData: null,
                                    isCash: true,
                                    uploadedAt: new Date().toISOString(),
                                  };
                                  handlePaymentSubmission(p, proof);
                                }}
                              >
                                <Wallet className="w-4 h-4" /> Informar pagamento em dinheiro
                              </Button>
                            </div>

                            <div className="bg-info/5 p-4 rounded-lg border border-info/20 mt-2">
                              <p className="text-xs text-muted-foreground">
                                ℹ️ Ao enviar o comprovante a mensalidade será baixada automaticamente. Pagamentos em dinheiro aguardarão aprovação.
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-heading font-semibold text-primary">Eventos Próximos</h3>
          </div>
          {!upcomingEvents?.length ? (
            <p className="text-sm text-muted-foreground">Nenhum evento programado no momento.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event: any) => (
                <div key={event.id} className="border-l-4 border-primary pl-4 py-2">
                  {event.image_url && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <img src={event.image_url} alt={event.title} className="w-full h-32 object-cover rounded-md mb-2 cursor-pointer hover:opacity-90 transition-opacity" />
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl p-2 bg-transparent border-0 shadow-none">
                        <img src={event.image_url} alt={event.title} className="max-w-full max-h-[90vh] rounded-md object-contain mx-auto" />
                      </DialogContent>
                    </Dialog>
                  )}
                  <p className="font-medium text-foreground text-sm">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                  <p className="text-xs text-primary font-semibold mt-1">
                    📅 {format(new Date(event.event_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lost & Found Section */}
      {lostFoundItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-primary mb-4">
            <Package className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Achados e Perdidos</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lostFoundItems.map((item: any) => (
              <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {item.image_url && (
                  <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <p className="font-medium text-foreground text-sm">{item.title || item.description}</p>
                  <p className="text-muted-foreground text-xs mt-2">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    📅 {format(new Date(item.found_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}