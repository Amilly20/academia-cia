import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Save, Image as ImageIcon } from "lucide-react";

export default function Settings() {
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState("");

  // Buscar a logo atual
  const { data: logoData } = useQuery({
    queryKey: ["system-logo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commemorative_dates")
        .select("id, image_url")
        .eq("title", "SYSTEM_LOGO")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (logoData?.image_url) {
      setLogoUrl(logoData.image_url);
    }
  }, [logoData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveLogo = useMutation({
    mutationFn: async () => {
      if (logoData?.id) {
        const { error } = await supabase.from("commemorative_dates").update({ image_url: logoUrl }).eq("id", logoData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("commemorative_dates").insert({
          title: "SYSTEM_LOGO",
          event_date: "1900-01-01", // Data antiga para ocultar das listas normais
          image_url: logoUrl
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-logo"] });
      toast({ title: "Logo atualizada com sucesso!" });
    }
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize a aparência do seu sistema</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" /> Logo da Academia
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted flex items-center justify-center overflow-hidden bg-background shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Label className="mb-2 block">Escolher nova imagem</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer" />
                <p className="text-xs text-muted-foreground mt-2">Recomendado: Imagem quadrada (PNG ou JPG)</p>
              </div>
            </div>
            
            <Button onClick={() => saveLogo.mutate()} disabled={saveLogo.isPending || !logoUrl} className="gap-2 gradient-primary text-primary-foreground border-0">
              <Save className="w-4 h-4" /> {saveLogo.isPending ? "Salvando..." : "Salvar Logo"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}