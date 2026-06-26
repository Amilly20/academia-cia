import { getDatabase, ref, get, set } from "firebase/database";
import { getStorage, ref as storageRef, uploadString, getDownloadURL, uploadBytes } from "firebase/storage";

const initialDataStructure = {
  students: [],
  payments: [],
  events: [],
  lostAndFound: [],
  announcements: [],
  notifications: [],
  paymentProofs: [],
  settings: {
    SYSTEM_LOGO: null,
    PIX_KEY: "00074814540"
  },
};

/**
 * Fetches the entire database from Firebase.
 * If the database is empty, it seeds it with the initial structure.
 */
export const getFirebaseData = async (): Promise<any> => {
  try {
    const db = getDatabase();
    const snapshot = await get(ref(db));
    let data = snapshot.val();
    
    if (!data) {
      console.log("Firebase is empty, seeding with initial data...");
      await setFirebaseData(initialDataStructure);
      return initialDataStructure;
    }
    return data;
  } catch (error) {
    console.error("Failed to get initial data from Firebase:", error);
    throw error;
  }
};

/**
 * Writes the entire database object to Firebase.
 * @param data The entire data object to save.
 */
export const setFirebaseData = async (data: unknown) => {
  try {
    const db = getDatabase();
    await set(ref(db), data);
  } catch (error) {
    console.error("Failed to set data in Firebase:", error);
  }
};

export const compressImage = (file: File, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => reject(new Error("Falha ao carregar a imagem."));
    };
    reader.onerror = (err) => reject(new Error("Falha ao ler o arquivo."));
  });
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

export const uploadFileToStorage = async (file: File): Promise<string> => {
  const storage = getStorage();
  const fileRef = storageRef(storage, `uploads/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};

export const uploadBase64ToStorage = async (base64Data: string): Promise<string> => {
  const storage = getStorage();
  const arr = base64Data.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--) {
      u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], {type: mime});
  const fileRef = storageRef(storage, `uploads/${Date.now()}.jpg`);
  await uploadBytes(fileRef, blob);
  return getDownloadURL(fileRef);
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

export const generatePassword = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
