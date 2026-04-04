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
  wageAmount: string;
  wageType: 'hourly' | 'daily' | 'project' | '';
};

function buildHourlyRate(
  wageAmount: string,
  wageType: 'hourly' | 'daily' | 'project' | ''
): string {
  const cleanedAmount = String(wageAmount || '').trim();

  if (!cleanedAmount || !wageType) {
    return '';
  }

  const wageLabels = {
    hourly: 'hour',
    daily: 'day',
    project: 'project',
  } as const;

  return `Rs. ${cleanedAmount} per ${wageLabels[wageType]}`;
}

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
  const cleanedSpecialty = form.specialty.trim();

  const parsedLat =
    typeof form.lat === 'number' ? form.lat : Number(form.lat);
  const parsedLng =
    typeof form.lng === 'number' ? form.lng : Number(form.lng);

  const parsedAge = form.age ? Number(form.age) : null;
  const parsedYearsExperience = form.yearsExperience
    ? Number(form.yearsExperience)
    : 0;
  const parsedWageAmount = form.wageAmount ? Number(form.wageAmount) : 0;

  const hourlyRate = buildHourlyRate(form.wageAmount, form.wageType);

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
    age: Number.isFinite(parsedAge as number) ? parsedAge : null,
    role,
    locationText: cleanedLocationText,
    lat: Number.isFinite(parsedLat) ? parsedLat : null,
    lng: Number.isFinite(parsedLng) ? parsedLng : null,
    joinedAt: serverTimestamp(),
  };

  if (role === 'user') {
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...baseData,
    });
  } else {
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...baseData,
      specialty: cleanedSpecialty,
      yearsExperience: Number.isFinite(parsedYearsExperience)
        ? parsedYearsExperience
        : 0,
      bio: cleanedBio,
      wageAmount: Number.isFinite(parsedWageAmount) ? parsedWageAmount : 0,
      wageType: form.wageType || '',
      hourlyRate: hourlyRate || 'Contact for pricing',
      rating: 0,
      totalReviews: 0,
      reviewCount: 0,
      completedProjects: 0,
      availability: 'Available',
      reviews: [],
      skills: [],
      certifications: [],
      education: [],
      projects: [],
      isVerified: false,
      website: '',
    });
  }

  return firebaseUser;
}