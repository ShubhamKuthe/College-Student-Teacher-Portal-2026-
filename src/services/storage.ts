import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../firebase'

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase()
}

export async function uploadPortalFile(pathPrefix: string, file: File) {
  const fileRef = ref(storage, `${pathPrefix}/${Date.now()}-${sanitizeFileName(file.name)}`)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}
