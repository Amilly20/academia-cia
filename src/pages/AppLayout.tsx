import { Outlet, Link, useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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





  const isStudentRoute = location.pathname === '/student-area';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-6 md:gap-10">
          <Link to="/">
            <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-heading font-bold text-primary hidden sm:block">Cia fitness</h1>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {!isStudentRoute ? (
              <>
                <Link to="/dashboard" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>Painel Admin</Link>
                <Link to="/students" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/students' ? 'text-primary' : 'text-muted-foreground'}`}>Alunos</Link>
                <Link to="/announcements" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/announcements' ? 'text-primary' : 'text-muted-foreground'}`}>Avisos</Link>
                <Link to="/billing" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/billing' ? 'text-primary' : 'text-muted-foreground'}`}>Cobrança</Link>
                <Link to="/payment-history" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/payment-history' ? 'text-primary' : 'text-muted-foreground'}`}>Histórico</Link>
                <Link to="/events" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/events' ? 'text-primary' : 'text-muted-foreground'}`}>Eventos</Link>
                <Link to="/lost-found" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/lost-found' ? 'text-primary' : 'text-muted-foreground'}`}>Achados e Perdidos</Link>
                <Link to="/settings" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/settings' ? 'text-primary' : 'text-muted-foreground'}`}>Configurações</Link>
              </>
            ) : (
              <>
                <Link to="/student-area" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/student-area' ? 'text-primary' : 'text-muted-foreground'}`}>Área do Aluno</Link>
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