import { useState, useEffect } from "react";
import { Gift, Check, Pencil, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFirebaseData, setFirebaseData } from "@/lib/localStorage";
import { toast } from "@/hooks/use-toast";

export default function BirthdayList() {
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [selectedBirthday, setSelectedBirthday] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    const data = await getFirebaseData();
    const students = Object.values(data.students || {});
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    const todayBirthdays = students.filter((student: any) => {
      if (!student.birth_date) return false;
      const [, month, day] = student.birth_date.split('-');
      return parseInt(month) === todayMonth && parseInt(day) === todayDay;
    });

    setBirthdays(todayBirthdays);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectBirthday = (studentId: string) => {
    const student = birthdays.find(b => b.id === studentId);
    toast({ 
      title: `🎉 ${student.full_name}`, 
      description: "foi marcado como aniversariante do dia!" 
    });
    setSelectedBirthday(studentId);
  };

  const handleEditBirthday = (student: any) => {
    setEditingId(student.id);
    setEditDate(student.birth_date);
  };

  const handleSaveEdit = async (studentId: string) => {
    const data = await getFirebaseData();
    const students = Object.values(data.students || {});
    const updatedStudents = students.map((s: any) =>
      s.id === studentId ? { ...s, birth_date: editDate } : s
    );
    data.students = updatedStudents;
    await setFirebaseData(data);
    
    // Update local state
    const updatedBirthdays = birthdays.map(b =>
      b.id === studentId ? { ...b, birth_date: editDate } : b
    );
    setBirthdays(updatedBirthdays);
    
    setEditingId(null);
    toast({ title: "Data de aniversário atualizada!" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDate("");
  };

  if (isLoading) {
    return <div className="rounded-xl border border-border bg-card p-6 flex justify-center items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" /> Aniversariantes do Dia
      </h3>
      {birthdays && birthdays.length > 0 ? (
        <div className="space-y-3">
          {birthdays.map((b: any) => (
            <div 
              key={b.id} 
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                selectedBirthday === b.id 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex-1">
                <span className="font-medium text-card-foreground">{b.full_name}</span>
                {editingId === b.id ? (
                  <div className="mt-2 flex gap-2">
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="h-8"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(b.id)}
                      className="bg-success hover:bg-success/90"
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(b.birth_date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {editingId !== b.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditBirthday(b)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={selectedBirthday === b.id ? "default" : "outline"}
                  onClick={() => handleSelectBirthday(b.id)}
                  disabled={editingId === b.id}
                  className={selectedBirthday === b.id ? "bg-primary" : ""}
                >
                  {selectedBirthday === b.id ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Selecionado
                    </>
                  ) : (
                    "Selecionar"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum aniversariante hoje.</p>
      )}
    </div>
  );
}