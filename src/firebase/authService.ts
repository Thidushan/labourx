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
  locationText: string;
  lat: number | string;
  lng: number | string;
};

export async function registerUser(
  role: 'user' | 'technician',
  form: RegisterFormData
) {
  const cleanedEmail = form.email.trim().toLowerCase();
  const cleanedName = form.name.trim();
  const cleanedPhone = form.phone.trim();
  const cleanedCity = form.city.trim();
  const cleanedAddress = form.address.trim();
  const cleanedBio = form.bio.trim();
  const cleanedLocationText = form.locationText.trim();

  const parsedLat =
    typeof form.lat === 'number' ? form.lat : Number(form.lat);
  const parsedLng =
    typeof form.lng === 'number' ? form.lng : Number(form.lng);

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    cleanedEmail,
    form.password
  );

  const firebaseUser = userCredential.user;

  const baseData = {
    uid: firebaseUser.uid,
    name: cleanedName,
    email: cleanedEmail,
    phone: cleanedPhone,
    city: cleanedCity,
    address: cleanedAddress,
    age: form.age ? Number(form.age) : null,
    role,
    locationText: cleanedLocationText,
    lat: Number.isFinite(parsedLat) ? parsedLat : null,
    lng: Number.isFinite(parsedLng) ? parsedLng : null,
    createdAt: serverTimestamp(),
  };

  if (role === 'user') {
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...baseData,
    });
  } else {
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...baseData,
      specialty: form.specialty,
      yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : 0,
      bio: cleanedBio,
      rating: 0,
      totalReviews: 0,
    });
  }

  return firebaseUser;
}