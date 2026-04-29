/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { signInUser, signOutUser } from '../services/auth'
import type { AppUser } from '../types/models'

interface AuthContextValue {
  user: User | null
  profile: AppUser | null
  loading: boolean
  authMessage: string | null
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearAuthMessage: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authMessage, setAuthMessage] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)

      if (!nextUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const snapshot = await getDoc(doc(db, 'users', nextUser.uid))

        if (!snapshot.exists()) {
          setProfile(null)
          setAuthMessage('Your account exists in Firebase Auth, but the Firestore profile is missing.')
          setLoading(false)
          return
        }

        const nextProfile = { id: snapshot.id, ...snapshot.data() } as AppUser

        if (!nextProfile.active) {
          setProfile(null)
          setAuthMessage('This account has been deactivated by an administrator.')
          await signOutUser()
          setLoading(false)
          return
        }

        setProfile(nextProfile)
        setLoading(false)
      } catch {
        setProfile(null)
        setAuthMessage('We could not load your profile. Check your Firebase rules and connection.')
        setLoading(false)
      }
    })

    return () => unsubscribeAuth()
  }, [])

  async function signIn(email: string, password: string) {
    setAuthMessage(null)

    try {
      await signInUser(email, password)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now.'
      setAuthMessage(message)
      throw error
    }
  }

  async function logout() {
    await signOutUser()
  }

  function clearAuthMessage() {
    setAuthMessage(null)
  }

  const value = {
    user,
    profile,
    loading,
    authMessage,
    signIn,
    logout,
    clearAuthMessage,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
