import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Calendar } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Events() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", event_date: "", description: "", image_url: "" });

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("commemorative_dates").select("*").neq("title", "SYSTEM_LOGO").order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("commemorative_dates").insert({
        title: form.title,
        event_date: form.event_date,
        description: form.description || null,
        image_url: form.image_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Evento criado!" });
      setOpen(false);
      setForm({ title: "", event_date: "", description: "", image_url: "" });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((f) => ({ ...f, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Datas Comemorativas</h1>
          <p className="text-muted-foreground mt-1">Banners e eventos da academia</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-primary text-primary-foreground border-0"><Plus className="w-4 h-4" /> Novo Evento</Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader><DialogTitle className="font-heading">Criar Evento</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Data</Label><Input type="date" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
              <div>
                <Label>Imagem/Banner do Aviso</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer" />
                {form.image_url && <img src={form.image_url} alt="Preview" className="mt-2 h-20 rounded-md object-cover" />}
              </div>
              <Button onClick={() => addEvent.mutate()} disabled={!form.title || !form.event_date} className="w-full gradient-primary text-primary-foreground border-0">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? <p className="text-muted-foreground">Carregando...</p> : !events?.length ? <p className="text-muted-foreground">Nenhum evento cadastrado</p> : events.map((ev) => (
          <div key={ev.id} className="rounded-xl border border-border bg-card overflow-hidden">
            {ev.image_url && <img src={ev.image_url} alt={ev.title} className="w-full h-40 object-cover" />}
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(ev.event_date + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR })}
              </div>
              <h3 className="font-heading font-semibold text-card-foreground">{ev.title}</h3>
              {ev.description && <p className="text-sm text-muted-foreground mt-1">{ev.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
