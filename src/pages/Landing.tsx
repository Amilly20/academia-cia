import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, ShieldCheck, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { verifyAdminCode } from "@/lib/localStorage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Landing() {
  const navigate = useNavigate();
  const [adminCode, setAdminCode] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAdminLogin = async () => {
    if (!adminCode) {
      toast({ title: "Digite um código", variant: "destructive" });
      return;
    }

    setIsLoggingIn(true);
    try {
      if (verifyAdminCode(adminCode)) {
        navigate("/dashboard");
      } else {
        toast({ title: "Código incorreto!", variant: "destructive" });
      }
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um problema ao tentar verificar o código.",
        variant: "destructive",
      });
      console.error("Admin login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
            <Dumbbell className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">
            Cia fitness
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Selecione o seu perfil para acessar o sistema.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full">
        {/* Card Aluno */}
        <div className="bg-card border border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors shadow-sm">
          <User className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-heading mb-2">Sou Aluno</h2>
          <p className="text-muted-foreground mb-6">Acesse seus pagamentos, fichas de treino e avisos importantes da academia.</p>
          <div className="space-y-3">
            <Link to="/student-area">
              <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 gap-2">
               Entrar como Aluno
              </Button>
            </Link>
          </div>
        </div>

        {/* Card Admin */}
        <div className="bg-card border border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors shadow-sm">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-heading mb-2">Sou Gestor</h2>
          <p className="text-muted-foreground mb-6">Acesse o painel de controle administrativo para gerenciar a academia.</p>

          <Dialog onOpenChange={(open) => !open && setAdminCode("")}>
            <DialogTrigger asChild>
              <Button className="w-full gradient-primary text-primary-foreground border-0 gap-2 mt-[52px]">
                Entrar como Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Acesso Restrito</DialogTitle>
                <DialogDescription>
                  Digite seu código de administrador para acessar o painel.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="admin-code" className="text-left font-medium">
                    Código de Administrador
                  </label>
                  <Input
                    id="admin-code"
                    type="password"
                    placeholder="••••••••"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoggingIn && handleAdminLogin()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdminLogin} disabled={isLoggingIn} className="w-full">
                  {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}