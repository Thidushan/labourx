import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

type RegisterFormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  age: string;
  address: string;
  city: string;
  specialty: string;
  yearsExperience: string;
  bio: string;
};

export async function registerUser(
  role: 'user' | 'technician',
  form: RegisterFormData
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    form.email,
    form.password
  );

  const firebaseUser = userCredential.user;

  const baseData = {
    uid: firebaseUser.uid,
    name: form.name,
    email: form.email,
    phone: form.phone,
    city: form.city,
    role,
    createdAt: serverTimestamp(),
  };

  if (role === 'user') {
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...baseData,
      age: form.age ? Number(form.age) : null,
      address: form.address || '',
    });
  } else {
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...baseData,
      specialty: form.specialty,
      yearsExperience: Number(form.yearsExperience),
      bio: form.bio,
      rating: 0,
      totalReviews: 0,
    });
  }

  return firebaseUser;
}