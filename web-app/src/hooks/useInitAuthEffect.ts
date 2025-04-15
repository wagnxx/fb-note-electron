import { clearAuthState, setAuthState } from '@/features/auth/authSlice'
import { useAppDispatch } from '@/store/hooks'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { useEffect } from 'react'
import { auth } from '@/firebase/authService'

export const useInitAuthEffect = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        dispatch(
          setAuthState({
            isAuthenticated: true,
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            },
          }),
        )
      } else {
        dispatch(clearAuthState())
      }
    })

    return () => unsubscribe()
  }, [dispatch])
}
