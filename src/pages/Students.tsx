import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import StudentFormDialog from "@/StudentFormDialog";
import { UserX, Search } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Students() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*, plans(name, price)")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").update({ status: "inactive" as const }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Aluno desativado" });
    },
  });

  const filtered = students?.filter((s) =>
    (s.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || "").includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os alunos da academia</p>
        </div>
        <StudentFormDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Telefone</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Plano</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Matrícula</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : !filtered?.length ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum aluno encontrado</td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {s.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{s.full_name}</p>
                        {s.email && <p className="text-xs text-muted-foreground">{s.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-card-foreground">{s.phone}</td>
                  <td className="p-4 text-sm text-card-foreground">{s.plans?.name || "—"}</td>
                  <td className="p-4">
                    <Badge variant={s.status === "active" ? "default" : "secondary"} className={s.status === "active" ? "bg-success/10 text-success border-success/20" : ""}>
                      {s.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(new Date(s.enrollment_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="p-4 text-right">
                    {s.status === "active" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Desativar ${s.full_name}?`)) {
                            deactivateMutation.mutate(s.id);
                          }
                        }}
                        className="text-overdue hover:text-overdue hover:bg-overdue/10"
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Desativar
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
