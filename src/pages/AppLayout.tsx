import { Outlet, Link, useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const Confetti = () => {
  const [pieces, setPieces] = useState<any[]>([]);

  useEffect(() => {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const newPieces = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-[-10%] w-2 h-4 rounded-sm opacity-90"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`
          }}
        />
      ))}
    </div>
  );
};

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

  const todayDate = new Date();
  const isFabriciaBirthday = todayDate.getDate() === 15 && todayDate.getMonth() === 4; // 15 de Maio (mês 4 pois Janeiro é 0)

  const isStudentRoute = location.pathname === '/student-area';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isFabriciaBirthday && <Confetti />}
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
        {isFabriciaBirthday && (
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-primary rounded-xl p-6 text-white shadow-lg mb-8 flex items-center justify-between animate-in fade-in zoom-in duration-700">
            <div>
              <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                🎉 Feliz Aniversário, Fabrícia! 🎂
              </h2>
              <p className="mt-2 text-white/90">
                Hoje é o seu dia especial! Desejamos muita saúde, sucesso e muitas conquistas para você e para a Cia Fitness. Aproveite o seu dia! 🥳
              </p>
            </div>
            <div className="text-6xl animate-bounce hidden sm:block">🎈</div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}