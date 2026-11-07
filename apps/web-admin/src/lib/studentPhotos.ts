// Gestionnaire centralisé des photos d'identité des élèves pour Kalansso OS

const STORAGE_KEY = 'kalansso_student_photos_v1';

export function getAllStudentPhotos(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getStudentPhoto(studentId: string): string | null {
  if (!studentId) return null;
  const photos = getAllStudentPhotos();
  return photos[studentId] || null;
}

export function saveStudentPhoto(studentId: string, base64Data: string): void {
  if (!studentId || !base64Data) return;
  try {
    const photos = getAllStudentPhotos();
    photos[studentId] = base64Data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('kalansso_student_photo_updated', {
          detail: { studentId, photo: base64Data },
        })
      );
    }
  } catch (err) {
    console.error('Erreur sauvegarde photo élève:', err);
  }
}

export function removeStudentPhoto(studentId: string): void {
  if (!studentId) return;
  try {
    const photos = getAllStudentPhotos();
    delete photos[studentId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('kalansso_student_photo_updated', {
          detail: { studentId, photo: null },
        })
      );
    }
  } catch (err) {
    console.error('Erreur suppression photo élève:', err);
  }
}
