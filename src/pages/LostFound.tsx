import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LostFound() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");

  const { data: items, isLoading } = useQuery({
    queryKey: ["lost-found"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lost_and_found").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lost_and_found").insert({ description: desc });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lost-found"] });
      toast({ title: "Item registrado!" });
      setOpen(false);
      setDesc("");
    },
  });

  const claimItem = useMutation({
    mutationFn: async (id: string) => {
      const name = prompt("Nome de quem resgatou:");
      if (!name) return;
      const { error } = await supabase.from("lost_and_found").update({ claimed: true, claimed_by: name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lost-found"] });
      toast({ title: "Item resgatado!" });
    },
  });

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
              <div><Label>Descrição</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex: Garrafa azul de 1L" /></div>
              <Button onClick={() => addItem.mutate()} disabled={!desc} className="w-full gradient-primary text-primary-foreground border-0">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? <p className="text-muted-foreground">Carregando...</p> : !items?.length ? <p className="text-muted-foreground">Nenhum item registrado</p> : items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-card-foreground">{item.description}</p>
              <p className="text-sm text-muted-foreground">
                Encontrado em {format(new Date(item.found_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                {item.claimed_by && ` · Resgatado por ${item.claimed_by}`}
              </p>
            </div>
            {item.claimed ? (
              <Badge className="bg-success/10 text-success border-success/20">Resgatado</Badge>
            ) : (
              <Button size="sm" variant="outline" onClick={() => claimItem.mutate(item.id)}><Check className="w-4 h-4 mr-1" /> Resgatar</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
