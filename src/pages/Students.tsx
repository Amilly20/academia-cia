import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import StudentFormDialog from "@/StudentFormDialog";
import { toast } from "@/hooks/use-toast";
import { UserX, Search, Trash2, Eye, MoreVertical, Loader2, Calendar, Pencil, MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getFirebaseData, setFirebaseData } from "@/lib/localStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Students() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [newEnrollmentDate, setNewEnrollmentDate] = useState("");
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatStudent, setChatStudent] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const fetchData = async () => {
    const data = await getFirebaseData();
    setStudents(Object.values(data.students || {}));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deactivateStudent = async (id: string) => {
    const data = await getFirebaseData();
    const studentsArray = Object.values(data.students || {});
    const updatedStudents = studentsArray.map((s: any) => 
      s.id === id ? { ...s, status: "inactive" } : s
    );
    data.students = updatedStudents;
    await setFirebaseData(data);
    setStudents(updatedStudents);
    toast({ title: "Aluno desativado" });
  };

  const deleteStudent = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja deletar permanentemente ${name}? Esta ação não pode ser desfeita.`)) {
      const data = await getFirebaseData();
      const studentsArray = Object.values(data.students || {});
      const paymentsArray = Object.values(data.payments || {});
      const updatedStudents = studentsArray.filter((s: any) => s.id !== id);
      const updatedPayments = paymentsArray.filter((p: any) => p.student_id !== id);
      data.students = updatedStudents;
      data.payments = updatedPayments;
      await setFirebaseData(data);
      setStudents(updatedStudents);
      toast({ title: "Aluno deletado com sucesso" });
    }
  };

  const handleSaveEnrollmentDate = async (id: string) => {
    if (!newEnrollmentDate) {
      toast({ title: "Selecione uma data", variant: "destructive" });
      return;
    }
    const data = await getFirebaseData();
    const studentsArray = Object.values(data.students || {});
    const updatedStudents = studentsArray.map((s: any) =>
      s.id === id ? { ...s, enrollment_date: newEnrollmentDate } : s
    );
    data.students = updatedStudents;
    await setFirebaseData(data);
    setStudents(updatedStudents);
    toast({ title: "Data de matrícula atualizada!" });
    setEditingDateId(null);
  };

  const handleSaveName = async (id: string) => {
    if (!newName.trim()) {
      toast({ title: "Nome inválido", variant: "destructive" });
      return;
    }
    const data = await getFirebaseData();
    const studentsArray = Object.values(data.students || {});
    const updatedStudents = studentsArray.map((s: any) =>
      s.id === id ? { ...s, full_name: newName } : s
    );
    data.students = updatedStudents;
    await setFirebaseData(data);
    setStudents(updatedStudents);
    toast({ title: "Nome atualizado!" });
    setEditingNameId(null);
  };

  const openChat = async (student: any) => {
    setChatStudent(student);
    const data = await getFirebaseData();
    const messages = (data.messages || []).filter((m: any) => m.student_id === student.id).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setChatMessages(messages);
    setChatOpen(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatStudent) return;
    try {
      const data = await getFirebaseData();
      const messages = data.messages || [];
      const newMsg = {
        id: String(Date.now()),
        student_id: chatStudent.id,
        sender: 'admin',
        text: newMessage,
        created_at: new Date().toISOString(),
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

  const filtered = students?.filter((s) =>
    (s.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || "").includes(search)
  ).sort((a: any, b: any) => (a.full_name || "").localeCompare(b.full_name || ""));
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os alunos da academia</p>
        </div>
        <StudentFormDialog onStudentCreated={fetchData} />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Telefone</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Matrícula</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!filtered?.length ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum aluno encontrado</td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={s.profile_picture_url || `https://ui-avatars.com/api/?name=${s.full_name.replace(/\s/g, "+")}&background=random`} 
                        alt={s.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          {editingNameId === s.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="h-8 w-40"
                                autoFocus
                              />
                              <Button size="sm" onClick={() => handleSaveName(s.id)} className="h-8 px-2 bg-success hover:bg-success/90">Salvar</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingNameId(null)} className="h-8 px-2">Cancelar</Button>
                            </div>
                          ) : (
                            <>
                              <p className="font-medium text-card-foreground">{s.full_name}</p>
                              <Badge variant="secondary" className="font-mono">{s.unique_code}</Badge>
                            </>
                          )}
                        </div>
                        {s.monthly_fee && editingNameId !== s.id && <p className="text-xs text-muted-foreground">R$ {Number(s.monthly_fee).toFixed(2)}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-card-foreground">{s.phone}</td>
                  <td className="p-4">
                    <Badge variant={s.status === "active" ? "default" : "secondary"} className={s.status === "active" ? "bg-success/10 text-success border-success/20" : ""}>
                      {s.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground min-w-[200px]">
                    {editingDateId === s.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={newEnrollmentDate}
                          onChange={(e) => setNewEnrollmentDate(e.target.value)}
                          className="h-8 w-36"
                        />
                        <Button size="sm" onClick={() => handleSaveEnrollmentDate(s.id)} className="h-8 bg-success hover:bg-success/90">Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingDateId(null)} className="h-8">Cancelar</Button>
                      </div>
                    ) : (
                      (s.enrollment_date || s.joined_at) ? format(new Date((s.enrollment_date || s.joined_at) + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : ""
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {s.status === "active" && (
                          <DropdownMenuItem onClick={() => {
                            if (confirm(`Desativar ${s.full_name}?`)) {
                              deactivateStudent(s.id);
                            }
                          }} className="text-overdue cursor-pointer">
                            <UserX className="w-4 h-4 mr-2" />
                            Desativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => {
                          setEditingNameId(s.id);
                          setNewName(s.full_name || "");
                        }} className="cursor-pointer">
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar Nome
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEditingDateId(s.id);
                          setNewEnrollmentDate(s.enrollment_date || s.joined_at || "");
                        }} className="cursor-pointer">
                          <Calendar className="w-4 h-4 mr-2" />
                          Editar Matrícula
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openChat(s)} className="cursor-pointer text-primary">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat com Aluno
                        </DropdownMenuItem>
                        {s.status === "inactive" && (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-muted-foreground cursor-pointer">
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver Senha
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DialogContent className="bg-card">
                                <DialogHeader>
                                  <DialogTitle className="font-heading">Senha de {s.full_name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">Código de Acesso:</p>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xl font-bold text-primary font-mono">{s.unique_code}</p>
                                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(s.unique_code); toast({ title: "Código copiado!" }); }}>
                                        Copiar
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">Senha:</p>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xl font-bold text-primary font-mono">{s.password}</p>
                                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(s.password); toast({ title: "Senha copiada!" }); }}>
                                        Copiar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => deleteStudent(s.id, s.full_name)} className="text-destructive cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar Aluno
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-[425px] h-[500px] flex flex-col bg-card">
          <DialogHeader>
            <DialogTitle className="font-heading">Chat com {chatStudent?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 p-2 pr-4 mt-4">
            {chatMessages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground mt-10">Nenhuma mensagem ainda.</p>
            ) : (
              chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 ${msg.sender === 'admin' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
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
            <Button type="submit" disabled={!newMessage.trim()} size="icon" className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
