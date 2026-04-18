import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getFirebaseData, setFirebaseData } from "@/lib/localStorage";

export default function Announcements() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", image_url: "" });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  const fetchData = async () => {
    const data = await getFirebaseData();
    const announcementsArray = Object.values(data.announcements || {});
    const announcementsList = announcementsArray.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setAnnouncements(announcementsList);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleAddAnnouncement = async () => {
    if (!form.title || !form.description) return;
    
    const data = await getFirebaseData();
    const announcementsArray = Object.values(data.announcements || {});
    
    const newAnnouncement = {
      id: String(Math.max(0, ...announcementsArray.map((ann: any) => parseInt(ann.id) || 0)) + 1),
      title: form.title,
      description: form.description,
      image_url: form.image_url || null,
      created_at: new Date().toISOString().split("T")[0],
    };

    data.announcements = [...announcementsArray, newAnnouncement];
    await setFirebaseData(data);
    
    toast({ title: "Aviso criado!" });
    setOpen(false);
    setForm({ title: "", description: "", image_url: "" });
    fetchData();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este aviso?")) return;
    
    const data = await getFirebaseData();
    const announcementsArray = Object.values(data.announcements || {});
    data.announcements = announcementsArray.filter((ann: any) => ann.id !== id);
    await setFirebaseData(data);
    
    toast({ title: "Aviso deletado!" });
    fetchData();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Avisos</h1>
          <p className="text-muted-foreground mt-1">Publique avisos e comunicados para os alunos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-primary text-primary-foreground border-0">
              <Plus className="w-4 h-4" /> Novo Aviso
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle className="font-heading">Criar Novo Aviso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Título do Aviso</Label>
                <Input 
                  value={form.title} 
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} 
                  placeholder="Ex: Manutenção de Equipamentos"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea 
                  value={form.description} 
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} 
                  placeholder="Escreva o conteúdo completo do aviso..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Imagem/Banner (Opcional)</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer" />
                {form.image_url && <img src={form.image_url} alt="Preview" className="mt-2 h-24 rounded-md object-cover" />}
              </div>
              <Button 
                onClick={() => handleAddAnnouncement()} 
                disabled={!form.title || !form.description} 
                className="w-full gradient-primary text-primary-foreground border-0"
              >
                Publicar Aviso
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : !announcements?.length ? (
          <p className="text-muted-foreground">Nenhum aviso publicado. Clique em "Novo Aviso" para criar um.</p>
        ) : (
          announcements.map((ann) => (
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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-warning" />
                      <h3 className="font-heading font-semibold text-card-foreground">{ann.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{ann.description}</p>
                    <p className="text-xs text-muted-foreground mt-3">
                      📅 {format(new Date(ann.created_at + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                  onClick={() => handleDeleteAnnouncement(ann.id)}
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
