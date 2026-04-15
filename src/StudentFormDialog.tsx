import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export default function StudentFormDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", birth_date: "" });

  const addStudent = useMutation({
    mutationFn: async () => {
      const payload: any = {
        full_name: form.full_name,
        phone: form.phone,
        birth_date: form.birth_date,
        status: "active"
      };
      if (form.email) payload.email = form.email;

      const { error } = await supabase.from("students").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Aluno cadastrado com sucesso!" });
      setOpen(false);
      setForm({ full_name: "", phone: "", email: "", birth_date: "" });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-primary text-primary-foreground border-0">
          <Plus className="w-4 h-4" /> Novo Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <DialogHeader><DialogTitle className="font-heading">Cadastrar Novo Aluno</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          <div><Label>Nome Completo</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
          <div><Label>Telefone (WhatsApp)</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Ex: 11999999999" /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div><Label>Data de Nascimento</Label><Input type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} /></div>
          <Button onClick={() => addStudent.mutate()} disabled={!form.full_name || !form.phone || addStudent.isPending} className="w-full gradient-primary text-primary-foreground border-0">
            {addStudent.isPending ? "Salvando..." : "Salvar Aluno"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}