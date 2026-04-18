import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Check, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getFirebaseData, setFirebaseData } from "@/lib/localStorage";

export default function LostFound() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", image_url: "" });
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    const data = await getFirebaseData();
    const itemsArray = Object.values(data.lostAndFound || {});
    const lostItems = itemsArray.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setItems(lostItems);
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

  const handleAddItem = async () => {
    if (!form.description) return;
    
    const data = await getFirebaseData();
    const itemsArray = Object.values(data.lostAndFound || {});

    const newItem = {
      id: String(Math.max(0, ...itemsArray.map((item: any) => parseInt(item.id) || 0)) + 1),
      title: form.title || form.description.substring(0, 30),
      description: form.description,
      image_url: form.image_url || null,
      claimed: false,
      claimed_by: null,
      created_at: new Date().toISOString().split("T")[0],
      found_date: new Date().toISOString().split("T")[0],
    };

    data.lostAndFound = [...itemsArray, newItem];
    await setFirebaseData(data);
    
    toast({ title: "Item registrado!" });
    setOpen(false);
    setForm({ title: "", description: "", image_url: "" });
    fetchData();
  };

  const handleClaimItem = async (id: string) => {
    const name = prompt("Nome de quem resgatou:");
    if (!name) return;
    
    const data = await getFirebaseData();
    const items = Object.values(data.lostAndFound || {});
    const itemIndex = items.findIndex((item: any) => item.id === id);

    if (itemIndex !== -1) {
      (items[itemIndex] as any).claimed = true;
      (items[itemIndex] as any).claimed_by = name;
      await setFirebaseData(data);
      toast({ title: "Item resgatado!" });
      fetchData();
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este item?")) return;
    
    const data = await getFirebaseData();
    const itemsArray = Object.values(data.lostAndFound || {});
    data.lostAndFound = itemsArray.filter((item: any) => item.id !== id);
    await setFirebaseData(data);
    
    toast({ title: "Item deletado!" });
    fetchData();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Achados e Perdidos</h1>
          <p className="text-muted-foreground mt-1">Objetos esquecidos na academia</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-primary text-primary-foreground border-0"><Plus className="w-4 h-4" /> Novo Item</Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader><DialogTitle className="font-heading">Registrar Objeto</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome/Título do Item</Label>
                <Input 
                  value={form.title} 
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} 
                  placeholder="Ex: Garrafa azul" 
                />
              </div>
              <div>
                <Label>Descrição Detalhada</Label>
                <Input 
                  value={form.description} 
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} 
                  placeholder="Ex: Garrafa azul de 1L com logo da Nike" 
                />
              </div>
              <div>
                <Label>Foto do Objeto</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer" />
                {form.image_url && <img src={form.image_url} alt="Preview" className="mt-2 h-24 rounded-md object-cover" />}
              </div>
              <Button onClick={() => handleAddItem()} disabled={!form.description} className="w-full gradient-primary text-primary-foreground border-0">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : !items?.length ? (
          <p className="text-muted-foreground">Nenhum item registrado</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground text-lg">{item.title || item.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      📅 {format(new Date(item.found_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                      {item.claimed_by && ` · Resgatado por ${item.claimed_by}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.claimed ? (
                    <Badge className="bg-success/10 text-success border-success/20">Resgatado</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleClaimItem(item.id)} className="gap-1">
                      <Check className="w-4 h-4" /> Resgatar
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
