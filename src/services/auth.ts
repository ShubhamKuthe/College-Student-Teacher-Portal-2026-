import { deleteApp, initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, firebaseConfig } from '../firebase'
import type { AppUser, Role } from '../types/models'

export async function signInUser(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signOutUser() {
  return signOut(auth)
}

export async function createUserByAdmin(input: {
  name: string
  email: string
  password: string
  role: Role
}) {
  const secondaryApp = initializeApp(firebaseConfig, `portal-secondary-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      input.email,
      input.password,
    )

    const profile: AppUser = {
      id: credential.user.uid,
      name: input.name,
      email: input.email,
      role: input.role,
      active: true,
    }

    await setDoc(doc(db, 'users', credential.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
    })

    await signOut(secondaryAuth)
    return profile
  } finally {
    await deleteApp(secondaryApp)
  }
}
