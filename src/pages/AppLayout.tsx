import { Outlet, Link, useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";

export default function AppLayout() {
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  const { data: logoData } = useQuery({
    queryKey: ["system-logo"],
    queryFn: async () => {
      const { data } = await supabase
        .from("commemorative_dates")
        .select("image_url")
        .eq("title", "SYSTEM_LOGO")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const isStudentRoute = location.pathname === '/student-area' || location.pathname === '/cadastro';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-6 md:gap-10">
          <Link to="/">
            <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {logoData?.image_url && <img src={logoData.image_url} alt="Logo" className="h-8 w-8 rounded-full object-cover" />}
              <h1 className="text-xl font-heading font-bold text-primary hidden sm:block">Cia fitness</h1>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {!isStudentRoute ? (
              <>
                <Link to="/dashboard" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>Painel Admin</Link>
                <Link to="/students" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/students' ? 'text-primary' : 'text-muted-foreground'}`}>Alunos</Link>
                <Link to="/billing" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/billing' ? 'text-primary' : 'text-muted-foreground'}`}>Cobrança</Link>
                <Link to="/settings" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/settings' ? 'text-primary' : 'text-muted-foreground'}`}>Configurações</Link>
              </>
            ) : (
              <>
                <Link to="/student-area" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/student-area' ? 'text-primary' : 'text-muted-foreground'}`}>Minha Área</Link>
                <Link to="/cadastro" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/cadastro' ? 'text-primary' : 'text-muted-foreground'}`}>Matrícula</Link>
              </>
            )}
          </nav>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </header>
      <main className="p-4 md:p-8 flex-1 w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}