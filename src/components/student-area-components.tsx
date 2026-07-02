import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, AlertCircle, Calendar, Users, Package, CreditCard, CheckCircle, Wallet, Send, Trash2, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "@/hooks/use-toast";
import { getFirebaseData, setFirebaseData, compressImage } from "@/lib/localStorage";
import { useState, useEffect } from "react";

export const StudentAnnouncements = ({ announcements }: { announcements: any[] }) => {
  if (!announcements || announcements.length === 0) return null;
  return (
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
  );
};

export const StudentBirthdays = () => {
    const [birthdaysToday, setBirthdaysToday] = useState<any[]>([]);

    useEffect(() => {
        const fetchBirthdays = async () => {
            const data = await getFirebaseData();
            const students = Object.values(data.students || {});
            const today = new Date();
            const todayMonth = today.getMonth() + 1;
            const todayDay = today.getDate();

            const todayBirthdays = students.filter((student: any) => {
                if (!student.birth_date) return false;
                const [, month, day] = student.birth_date.split('-');
                return parseInt(month) === todayMonth && parseInt(day) === todayDay;
            });
            setBirthdaysToday(todayBirthdays);
        };
        fetchBirthdays();
    }, []);


    if (birthdaysToday.length === 0) return null;

    return (
        <div className="rounded-xl border border-success/20 bg-success/5 p-6">
            <div className="flex items-center gap-2 text-success mb-4">
                <Users className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Aniversariantes do Dia!</h3>
            </div>
            <div className="space-y-3">
                {birthdaysToday.map(person => (
                    <div key={person.id} className="p-3 rounded-lg border-2 border-success/20 bg-success/5">
                        <p className="text-sm font-medium text-foreground">
                            🎉 {person.full_name} está fazendo aniversário hoje! Parabéns, Feliz Aniversário!
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const StudentEvents = ({ events }: { events: any[] }) => {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-heading font-semibold text-primary">Eventos Próximos</h3>
        </div>
        <p className="text-sm text-muted-foreground">Nenhum evento programado no momento.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-heading font-semibold text-primary">Eventos Próximos</h3>
      </div>
      <div className="space-y-3">
        {events.slice(0, 3).map((event: any) => (
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
    </div>
  );
};

export const StudentLostFound = ({ items }: { items: any[] }) => {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 text-primary mb-4">
        <Package className="w-5 h-5" />
        <h3 className="font-semibold text-lg">Achados e Perdidos</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item: any) => (
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
  );
};

export const StudentNotifications = ({ notifications, onDelete }: { notifications: any[], onDelete: (id: string) => void }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 text-primary mb-4">
        <MessageCircle className="w-5 h-5" />
        <h3 className="font-semibold text-lg">Suas Notificações</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {notifications.map((notif: any) => (
          <div key={notif.id} className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm relative group">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(notif.id)}
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
  );
};

export const StudentPayments = (props: any) => {
    const { payments, proofs, pixKey, dialogOpenStates, setDialogOpenStates, handlePaymentSubmission, loggedInStudent, chatMessages, setChatMessages, uploadBase64ToStorage, uploadFileToStorage } = props;
    const [newMessage, setNewMessage] = useState("");

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
          
          setChatMessages((prev: any) => [...prev, newMsg]);
          setNewMessage("");
        } catch (error) {
          toast({ title: "Erro ao enviar mensagem", variant: "destructive" });
        }
      };

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-heading font-semibold text-primary">Suas Mensalidades</h3>
                </div>
                <Dialog onOpenChange={() => {}}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <MessageCircle className="w-4 h-4" /> Falar com Gestor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] h-[500px] flex flex-col">
                        <DialogHeader><DialogTitle className="font-heading">Chat com Gestor</DialogTitle></DialogHeader>
                        <div className="flex-1 overflow-y-auto space-y-4 p-2 pr-4 mt-4">
                            {chatMessages.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground mt-10">Nenhuma mensagem ainda.</p>
                            ) : (
                                chatMessages.map((msg: any) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-lg p-3 ${msg.sender === 'student' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                                            <p className="text-sm">{msg.text}</p>
                                            <p className="text-[10px] opacity-70 mt-1 text-right">{format(new Date(msg.created_at), "HH:mm")}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-border mt-auto">
                            <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1" />
                            <Button type="submit" disabled={!newMessage.trim()} size="icon" className="shrink-0"><Send className="w-4 h-4" /></Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            {!payments?.length ? (
                <p className="text-sm text-muted-foreground">Você não possui mensalidades pendentes.</p>
            ) : (
                <div className="space-y-4">
                    {payments.map((p: any) => {
                        const dueDate = new Date(p.due_date + "T12:00:00");
                        const isDueToday = isToday(dueDate);
                        const isOverdue = new Date() > dueDate && p.status !== "paid";
                        return (
                            <div key={p.id} className={`rounded-lg p-4 border-2 transition-all ${isDueToday || isOverdue ? "border-overdue/50 bg-overdue/5" : p.status === "paid" ? "border-success/50 bg-success/5" : "border-border bg-background/50"}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-lg text-foreground">R$ {Number(p.amount).toFixed(2)}</p>
                                        <p className={`text-sm mt-1 ${isDueToday ? "font-bold text-overdue" : isOverdue ? "font-bold text-overdue" : "text-muted-foreground"}`}>
                                            📅 Vencimento: {format(dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                            {isDueToday && " ⚠️ VENCE HOJE!"}
                                            {isOverdue && " ⚠️ VENCIDO!"}
                                        </p>
                                    </div>
                                    {p.status === "paid" ? <Badge className="bg-success/10 text-success border-success/20 gap-1"><CheckCircle className="w-3 h-3" /> Pago</Badge> : <Badge className={isDueToday || isOverdue ? "bg-overdue/10 text-overdue border-overdue/20" : "bg-warning/10 text-warning border-warning/20"}>Pendente</Badge>}
                                </div>
                                {p.status !== "paid" && (proofs.some((pr: any) => pr.paymentId === p.id) ? (() => { const proof = proofs.find((pr: any) => pr.paymentId === p.id); return (<div className="bg-blue-500/10 text-blue-500 text-sm font-medium p-3 rounded-lg flex items-center justify-center gap-2 mt-2 border border-blue-500/20"><CheckCircle className="w-4 h-4" /> {proof.isCash ? "Pagamento presencial em análise" : "Comprovante em análise"}</div>); })() : (
                                    <Dialog open={dialogOpenStates[p.id]} onOpenChange={(open) => setDialogOpenStates((prev: any) => ({ ...prev, [p.id]: open }))}>
                                        <DialogTrigger asChild><Button className="w-full gap-2 gradient-primary text-primary-foreground border-0 mb-2"><CreditCard className="w-4 h-4" /> Pagar Agora</Button></DialogTrigger>
                                        <DialogContent className="bg-card max-w-md">
                                            <DialogHeader><DialogTitle className="font-heading">Pagamento de Mensalidade</DialogTitle><p className="text-sm text-muted-foreground pt-1">Realize o pagamento via PIX e envie o comprovante para dar baixa.</p></DialogHeader>
                                            <div className="mt-4 space-y-4">
                                                <div className="bg-muted/50 p-4 rounded-lg border border-border"><p className="text-sm text-muted-foreground mb-2">Valor a Pagar:</p><p className="text-2xl font-bold text-foreground">R$ {Number(p.amount).toFixed(2)}</p></div>
                                                <div>
                                                    <Label className="text-base font-semibold mb-3 block">Chave PIX</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input readOnly value={pixKey} className="flex-1 font-mono" />
                                                        <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(pixKey); toast({ title: "PIX copiado!", description: "Chave PIX foi copiada para a área de transferência." }); }}><Copy className="w-4 h-4" /></Button>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-2">💡 Copie a chave e abra seu banco para fazer a transferência PIX</p>
                                                </div>
                                                <div>
                                                    <Label className="text-base font-semibold mb-3 block">Enviar Comprovante</Label>
                                                    <Input type="file" accept="image/*,.pdf" className="cursor-pointer" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { toast({ title: "Enviando comprovante...", description: "Otimizando e fazendo upload seguro para o Storage." }); try { let downloadUrl: string; const isPdf = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf"); if (!isPdf) { const compressedData = await compressImage(file); downloadUrl = await uploadBase64ToStorage(compressedData); } else { downloadUrl = await uploadFileToStorage(file); } const proof = { paymentId: p.id, fileName: file.name || "comprovante.jpg", fileData: downloadUrl, uploadedAt: new Date().toISOString(), }; setDialogOpenStates((prev: any) => ({ ...prev, [p.id]: false })); setTimeout(() => { handlePaymentSubmission(p, proof); }, 300); } catch (error: any) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); } } }} />
                                                    <Input type="file" accept="image/*,.pdf" className="cursor-pointer" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { toast({ title: "Processando comprovante..." }); try { const isPdf = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf"); if (isPdf) { toast({ title: "Atenção", description: "O envio de PDF foi desativado. Por favor, envie uma imagem (print) do comprovante.", variant: "destructive" }); return; } const base64Data = await compressImage(file); const proof = { paymentId: p.id, fileName: file.name || "comprovante.jpg", fileData: base64Data, uploadedAt: new Date().toISOString(), }; setDialogOpenStates((prev: any) => ({ ...prev, [p.id]: false })); setTimeout(() => { handlePaymentSubmission(p, proof); }, 300); } catch (error: any) { toast({ title: "Erro ao processar imagem", description: error.message, variant: "destructive" }); } } }} />
                                                    <p className="text-xs text-muted-foreground mt-2">📎 Faça uma captura de tela ou tire uma foto do comprovante e selecione-o acima</p>
                                                </div>
                                                <div className="relative my-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Ou</span></div></div>
                                                <div>
                                                    <Label className="text-base font-semibold mb-3 block">Pagamento Presencial</Label>
                                                    <Button variant="outline" className="w-full gap-2" onClick={() => { const proof = { paymentId: p.id, fileName: "Pagamento em Dinheiro ou Cartão", fileData: null, isCash: true, uploadedAt: new Date().toISOString(), }; setDialogOpenStates((prev: any) => ({ ...prev, [p.id]: false })); setTimeout(() => { handlePaymentSubmission(p, proof); }, 300); }}><Wallet className="w-4 h-4" /> Informar pagamento em dinheiro ou cartão na academia</Button>
                                                </div>
                                                <div className="bg-info/5 p-4 rounded-lg border border-info/20 mt-2"><p className="text-xs text-muted-foreground">ℹ️ Ao enviar o comprovante a mensalidade será baixada automaticamente. Pagamentos presenciais aguardarão aprovação.</p></div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};