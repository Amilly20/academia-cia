import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Save, Image as ImageIcon, ShieldCheck, Copy, CreditCard, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { getFirebaseData, setFirebaseData } from "@/lib/localStorage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ADMIN_CODE = "497778960517";

export default function Settings() {
  const [logoUrl, setLogoUrl] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [editingPix, setEditingPix] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getFirebaseData();
      const settings = data.settings || {};
      setPixKey((settings.PIX_KEY && settings.PIX_KEY !== "12.345.678/0001-90") ? settings.PIX_KEY : "00074814540");
      if (settings.logoUrl) {
        setLogoUrl(settings.logoUrl);
      }
    };
    fetchData();
  }, []);

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

  const handleSaveLogo = async () => {
    const data = await getFirebaseData();
    if (!data.settings) data.settings = {};
    data.settings.logoUrl = logoUrl;
    await setFirebaseData(data);
    
    toast({ title: "Logo salva!", description: "A logo da academia foi atualizada com sucesso." });
  };

  const handleSavePix = async () => {
    if (!pixKey.trim()) {
      toast({ title: "Erro", description: "A chave PIX não pode estar vazia", variant: "destructive" });
      return;
    }
    
    const data = await getFirebaseData();
    data.settings.PIX_KEY = pixKey;
    await setFirebaseData(data);
    
    toast({ title: "Chave PIX atualizada", description: `Chave: ${pixKey}` });
    setEditingPix(false);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    toast({ title: "Chave PIX copiada!" });
  };

  const handleResetRevenue = async () => {
    setIsResetting(true);
    try {
      const data = await getFirebaseData();
      // Muda o status para 'archived' em vez de deletar.
      // Isso zera a receita sem fazer o gerador automático recriar as faturas passadas.
      data.payments = Object.values(data.payments || {}).map((p: any) =>
        p.status === 'paid' ? { ...p, status: 'archived' } : p
      );
      await setFirebaseData(data);
      toast({
        title: "Receita Zerada!",
        description: "O histórico de pagamentos foi limpo e a receita total foi zerada.",
      });
    } catch (error) {
      toast({ title: "Erro ao zerar receita", variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

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
            
            <Button onClick={() => {
              toast({ title: "Logo será salva localmente!" });
            }} className="gap-2 gradient-primary text-primary-foreground border-0">
              <Save className="w-4 h-4" /> Salvar Logo
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Chave PIX para Cobrança
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure a chave PIX que será usada nas notificações de cobrança enviadas aos alunos.
            </p>
            {!editingPix ? (
              <div className="bg-muted p-4 rounded-lg border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Chave PIX Atual:</p>
                <div className="flex items-center gap-2 justify-between">
                  <p className="text-lg font-mono font-bold text-card-foreground break-all">{pixKey}</p>
                  <Button size="sm" variant="outline" onClick={handleCopyPix} className="gap-1">
                    <Copy className="w-4 h-4" /> Copiar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Input 
                  value={pixKey} 
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Ex: 12.345.678/0001-90 ou seu email/telefone"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Pode ser CPF/CNPJ, email ou telefone formatados
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleSavePix} className="gap-2 gradient-primary text-primary-foreground border-0 flex-1">
                    <Save className="w-4 h-4" /> Salvar Chave PIX
                  </Button>
                  <Button onClick={() => setEditingPix(false)} variant="outline" className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
            {!editingPix && (
              <Button onClick={() => setEditingPix(true)} variant="outline" className="w-full">
                Editar Chave PIX
              </Button>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Código de Administrador
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Seu código de administrador é fixo e não pode ser alterado. Use este código para fazer login como administrador.
            </p>
            <div className="bg-muted p-4 rounded-lg border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-2">Código Atual:</p>
              <p className="text-lg font-mono font-bold text-card-foreground break-all">{ADMIN_CODE}</p>
            </div>
            <p className="text-xs text-muted-foreground italic">
              💡 Nota: Os alunos recebem um código único quando você faz o cadastro deles na seção de "Alunos".
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-heading font-semibold text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Zona de Perigo
          </h3>
          <div className="space-y-4 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-card-foreground">Zerar Receita Total</p>
                <p className="text-xs text-muted-foreground">Esta ação irá apagar permanentemente todo o histórico de pagamentos confirmados.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="mt-2 sm:mt-0">Zerar Receita</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso irá apagar permanentemente todo o histórico de pagamentos e zerar a contagem de "Receita Total" no painel. As cobranças pendentes não serão afetadas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetRevenue} disabled={isResetting} className="bg-destructive hover:bg-destructive/90">{isResetting ? "Apagando..." : "Sim, apagar histórico"}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}