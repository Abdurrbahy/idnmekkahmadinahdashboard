import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient, getSupabaseCredentials, fetchUserProfile } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  canEdit: boolean
  isAdmin: boolean
  isStaff: boolean
  isActive: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const p = await fetchUserProfile(userId)
    setProfile(p)
    return p
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id)
    }
  }, [user?.id, loadProfile])

  useEffect(() => {
    const { isConfigured } = getSupabaseCredentials()
    const client = getSupabaseClient()

    if (!isConfigured || !client) {
      setLoading(false)
      return
    }

    client.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user?.id) {
        const p = await loadProfile(session.user.id)
        if (!p || !p.is_active) {
          // If inactive or missing profile, sign out immediately
          await client.auth.signOut()
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user?.id) {
        const p = await loadProfile(session.user.id)
        if (!p || !p.is_active) {
          await client.auth.signOut()
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient()
    if (!client) {
      return { success: false, error: 'Unable to reach the server. Check your connection.' }
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        if (
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.message?.includes('network')
        ) {
          return { success: false, error: 'Unable to reach the server. Check your connection.' }
        }
        return { success: false, error: 'Incorrect email or password.' }
      }

      if (!data.session || !data.user) {
        return { success: false, error: 'Incorrect email or password.' }
      }

      const userProfile = await fetchUserProfile(data.user.id)

      if (!userProfile || !userProfile.is_active) {
        // Immediate sign out if not active or no profile
        await client.auth.signOut()
        setUser(null)
        setSession(null)
        setProfile(null)
        return {
          success: false,
          error: 'Your account is awaiting administrator approval.',
        }
      }

      setUser(data.user)
      setSession(data.session)
      setProfile(userProfile)
      return { success: true }
    } catch (err: any) {
      if (
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('network')
      ) {
        return { success: false, error: 'Unable to reach the server. Check your connection.' }
      }
      return { success: false, error: 'Incorrect email or password.' }
    }
  }

  const signOut = async () => {
    const client = getSupabaseClient()
    if (client) {
      try {
        await client.auth.signOut()
      } catch (e) {
        console.error('Sign out error:', e)
      }
    }
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  const isActive = profile?.is_active === true
  const role: UserRole = profile?.role || 'walsan'
  const isAdmin = isActive && role === 'admin'
  const isStaff = isActive && (role === 'admin' || role === 'atasan')
  const canEdit = isAdmin

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        canEdit,
        isAdmin,
        isStaff,
        isActive,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
