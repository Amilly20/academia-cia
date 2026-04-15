import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { Gift } from "lucide-react";

export default function BirthdayList() {
  const { data: birthdays, isLoading } = useQuery({
    queryKey: ["birthdays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, birth_date")
        .eq("status", "active")
        .not("birth_date", "is", null);

      if (error) throw error;

      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();

      return data.filter((student) => {
        if (!student.birth_date) return false;
        const [, month, day] = student.birth_date.split('-');
        return parseInt(month) === todayMonth && parseInt(day) === todayDay;
      });
    },
  });

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" /> Aniversariantes do Dia
      </h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
      ) : birthdays && birthdays.length > 0 ? (
        <ul className="space-y-3">
          {birthdays.map((b) => (
            <li key={b.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
              <span className="font-medium text-card-foreground">{b.full_name}</span>
              <span className="text-muted-foreground">Hoje! 🎉</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum aniversariante hoje.</p>
      )}
    </div>
  );
}