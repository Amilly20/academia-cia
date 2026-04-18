import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { localData, setLocalStorage, getLocalStorage } from "@/lib/localStorage";

const generateUniqueCode = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    birth_date: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      const cleanPhone = form.phone.replace(/\D/g, "");

      if (cleanPhone.length < 10) {
        throw new Error("Por favor, preencha o número de WhatsApp com DDD");
      }

      if (!form.full_name || !form.email) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      const students = getLocalStorage("students") || localData.students;

      // Check if email already exists
      if (students.some((s: any) => s.email === form.email)) {
        throw new Error("Este e-mail já está cadastrado");
      }

      const uniqueCode = generateUniqueCode();
      const newStudent = {
        id: String(Math.max(...students.map((s: any) => parseInt(s.id) || 0)) + 1),
        full_name: form.full_name,
        phone: cleanPhone,
        email: form.email,
        birth_date: form.birth_date,
        unique_code: uniqueCode,
        status: "active",
        plans: { name: "Basic", price: 99 },
        joined_at: new Date().toISOString().split('T')[0],
      };

      students.push(newStudent);
      setLocalStorage("students", students);

      setGeneratedCode(uniqueCode);
      toast({ title: "Cadastro realizado com sucesso!", description: "Seu código de acesso foi gerado." });
      
      // Redirect to student area after 2 seconds
      setTimeout(() => {
        navigate("/student-area", { state: { studentId: newStudent.id, studentData: newStudent } });
      }, 2000);
    } catch (error: any) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
    } finally {
      setIsRegistering(false);
    }
  };

  if (generatedCode) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-card border border-border rounded-xl shadow-sm text-center">
        <h2 className="text-2xl font-bold font-heading text-primary mb-4">Cadastro Realizado! ✅</h2>
        <p className="text-sm text-muted-foreground mb-4">Seu código de acesso foi gerado:</p>
        <div className="bg-muted p-4 rounded-lg mb-4">
          <p className="text-xl font-bold text-card-foreground font-mono">{generatedCode}</p>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Guarde este código com segurança para fazer login na Área do Aluno</p>
        <Button onClick={() => navigate("/student-area")} className="w-full gradient-primary text-primary-foreground border-0">
          Ir para Área do Aluno
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-card border border-border rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold font-heading text-center text-primary mb-6">Cadastro de Aluno</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Nome Completo *</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="João Silva"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Telefone com DDD *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="birthDate">Data de Nascimento</Label>
          <Input
            id="birthDate"
            type="date"
            value={form.birth_date}
            onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
          />
        </div>

        <Button type="submit" disabled={isRegistering} className="w-full gradient-primary text-primary-foreground border-0">
          {isRegistering ? "Registrando..." : "Cadastrar"}
        </Button>
      </form>
    </div>
  );
}