const FIREBASE_URL = "https://academiacia-b2ce9-default-rtdb.firebaseio.com";

export const localData = {
  students: [],
  payments: [],
  events: [],
  lostAndFound: [],
  announcements: [],
  notifications: [],
  paymentProofs: [],
  settings: {
    SYSTEM_LOGO: null,
    PIX_KEY: "00074814540",
  },
};

const generatePassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Fetches the entire database from Firebase.
 * If the database is empty, it seeds it with the initial `localData` structure.
 */
export const getFirebaseData = async (): Promise<typeof localData> => {
  try {
    const response = await fetch(`${FIREBASE_URL}/.json`);
    if (!response.ok) {
      throw new Error(`Firebase fetch failed: ${response.statusText}`);
    }
    let data = await response.json();

    // If the database is empty (returns null), seed it with default data.
    if (!data) {
      console.log("Firebase is empty, seeding with initial data...");
      await setFirebaseData(localData);
      return localData;
    }

    // Ensure all top-level keys from localData exist to avoid errors on new features
    for (const key in localData) {
      if (!data.hasOwnProperty(key)) {
        data[key] = localData[key];
      }
    }

    return data;
  } catch (error) {
    console.error("Failed to get initial data from Firebase:", error);
    // Fallback to localData if Firebase is unreachable
    return localData;
  }
};

/**
 * Writes the entire database object to Firebase.
 * @param data The entire data object to save.
 */
export const setFirebaseData = async (data: unknown) => {
  try {
    const response = await fetch(`${FIREBASE_URL}/.json`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Firebase write failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Failed to set data in Firebase:", error);
  }
};

export const generateStudentPayments = (students: any[], payments: any[]): any[] => {
  const newPayments = [...payments];
  const today = new Date().toISOString().split("T")[0];

  // 1. Update payment status to overdue
  newPayments.forEach(payment => {
    if (payment.status === "pending" && payment.due_date < today) {
      payment.status = "overdue";
    }
  });

  let lastGeneratedId = Math.max(0, ...newPayments.map(p => parseInt(p.id) || 0));

  // 2. For each active student, generate missing monthly payments
  students.forEach(student => {
    if (student.status !== "active" || !(student.enrollment_date || student.joined_at)) {
      return;
    }

    const enrollmentDate = new Date((student.enrollment_date || student.joined_at) + "T12:00:00");
    const enrollmentDay = enrollmentDate.getDate();

    // Generate payments up to 45 days from today (para sempre mostrar a próxima fatura)
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 45);

    const todayDate = new Date();
    let monthsDiff = (todayDate.getFullYear() - enrollmentDate.getFullYear()) * 12 + (todayDate.getMonth() - enrollmentDate.getMonth());
    
    // O primeiro vencimento automático é no mês 1 (1 mês após a matrícula)
    let monthCounter = Math.max(1, monthsDiff - 1);

    // Loop to create payments month by month from enrollment
    while (true) {
      const nextDueDate = new Date(enrollmentDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + monthCounter);

      if (nextDueDate.getDate() !== enrollmentDay) {
        nextDueDate.setDate(0);
      }

      if (nextDueDate > limitDate) break;

      const dueDateStr = nextDueDate.toISOString().split('T')[0];
      const paymentExists = newPayments.some(p => p.student_id === student.id && p.due_date === dueDateStr);

      if (!paymentExists) {
        lastGeneratedId++;
        newPayments.push({ 
          id: String(lastGeneratedId), 
          student_id: student.id, 
          amount: student.monthly_fee || student.plans?.price?.toString() || "99.00", 
          due_date: dueDateStr, 
          status: "pending" as const, 
          paid_date: null 
        });
      }

      monthCounter++;
    }
  });
  
  return newPayments;
};

export const generateAutomaticNotifications = (data: any): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const notifyLimit = new Date(today);
  notifyLimit.setDate(notifyLimit.getDate() + 5); // Notifica 5 dias antes do vencimento

  const payments = Object.values(data.payments || {}) as any[];
  const students = Object.values(data.students || {}) as any[];
  let notifications = Object.values(data.notifications || {}) as any[];
  let modified = false;

  payments.forEach(payment => {
    if ((payment.status === "pending" || payment.status === "overdue") && !payment.notified) {
      const dueDate = new Date(payment.due_date + "T12:00:00");
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate <= notifyLimit) {
        const student = students.find(s => s.id === payment.student_id);
        if (student) {
          const amount = Number(payment.amount).toFixed(2).replace(".", ",");
          const [year, month, day] = payment.due_date.split('-');
          const dueDateStr = `${day}/${month}/${year}`;

          notifications.push({
            id: String(Date.now() + Math.floor(Math.random() * 10000)),
            student_id: payment.student_id,
            payment_id: payment.id,
            title: "Lembrete de Cobrança",
            description: `Sua mensalidade no valor de R$ ${amount} vence em ${dueDateStr}. Verifique a aba de Mensalidades para fazer o pagamento.`,
            created_at: new Date().toISOString()
          });
          payment.notified = true;
          modified = true;
        }
      }
    }
  });

  if (modified) {
    data.notifications = notifications;
    data.payments = payments;
  }
  return modified;
};

const ADMIN_CODE = "497778960517";

export const verifyAdminCode = (code: any): boolean => {
  if (!code) return false;
  const trimmedInput = String(code).trim().toLowerCase();
  const match = trimmedInput === ADMIN_CODE;
  console.log("Verificando Admin Code:", { 
    input: trimmedInput, 
    inputType: typeof code,
    inputLength: String(code).length,
    expected: ADMIN_CODE, 
    match 
  });
  return match;
};

export { generatePassword };
