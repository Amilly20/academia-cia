import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Calendar, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getFirebaseData, setFirebaseData } from "@/lib/localStorage";

export default function Events() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", event_date: "", description: "", image_url: "" });
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  const fetchData = async () => {
    const data = await getFirebaseData();
    const eventsArray = Object.values(data.events || {});
    const eventsList = eventsArray.sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    setEvents(eventsList);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEvent = async () => {
    if (!form.title || !form.event_date) return;
    
    const data = await getFirebaseData();
    const eventsArray = Object.values(data.events || {});
    const newEvent = {
      id: String(Math.max(0, ...eventsArray.map((ev: any) => parseInt(ev.id) || 0)) + 1),
      title: form.title,
      event_date: form.event_date,
      description: form.description || null,
      image_url: form.image_url || null,
      created_at: new Date().toISOString().split("T")[0],
    };

    data.events = [...eventsArray, newEvent];
    await setFirebaseData(data);
    
    toast({ title: "Evento criado!" });
    setOpen(false);
    setForm({ title: "", event_date: "", description: "", image_url: "" });
    fetchData();
  };

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

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este evento?")) return;
    
    const data = await getFirebaseData();
    const eventsArray = Object.values(data.events || {});
    data.events = eventsArray.filter((ev: any) => ev.id !== id);
    await setFirebaseData(data);
    
    toast({ title: "Evento deletado!" });
    fetchData();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

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
              <Button onClick={() => handleAddEvent()} disabled={!form.title || !form.event_date} className="w-full gradient-primary text-primary-foreground border-0">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : !events?.length ? (
          <p className="text-muted-foreground">Nenhum evento cadastrado</p>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className="rounded-xl border border-border bg-card overflow-hidden group relative">
              {ev.image_url && (
                <Dialog>
                  <DialogTrigger asChild>
                    <img src={ev.image_url} alt={ev.title} className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl p-2 bg-transparent border-0 shadow-none">
                    <img src={ev.image_url} alt={ev.title} className="max-w-full max-h-[90vh] rounded-md object-contain mx-auto" />
                  </DialogContent>
                </Dialog>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(ev.event_date + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR })}
                </div>
                <h3 className="font-heading font-semibold text-card-foreground">{ev.title}</h3>
                {ev.description && <p className="text-sm text-muted-foreground mt-1">{ev.description}</p>}
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3 text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                  onClick={() => handleDeleteEvent(ev.id)}
                >
                  <Trash2 className="w-4 h-4" /> Deletar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
