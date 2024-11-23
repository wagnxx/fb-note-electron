import { app } from './firebase'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  signInWithCredential,
  linkWithCredential,
  GithubAuthProvider,
  type Auth,
  AuthCredential,
  GoogleAuthProvider,
} from 'firebase/auth'

const auth: Auth = getAuth(app)

// Google 登录方法
export const signInWithGoogle = async (): Promise<boolean> => {
  try {
    // 创建 Google 提供程序实例
    const provider = new GoogleAuthProvider()

    // 发起 Google 登录流程
    const result = await signInWithPopup(auth, provider)

    // 登录成功后，获取用户信息
    const user = result.user

    // 用户信息示例
    console.log('User Info:', user)
    return true
  } catch (error) {
    // 处理登录错误
    console.error('Error during Google sign in:', error)
  }
  return false
}

// GitHub 登录功能
export const signInWithGithub = async (): Promise<boolean> => {
  try {
    // 创建 GitHub 提供程序对象
    const provider: GithubAuthProvider = new GithubAuthProvider()

    // 添加作用域，获取用户的邮箱地址
    provider.addScope('user:email')
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    const credential = GithubAuthProvider.credentialFromResult(result)
    const token = credential?.accessToken

    console.log('User Info:', user)
    console.log('GitHub Access Token:', token)
    return true
  } catch (error: any) {
    if (error?.code === 'auth/account-exists-with-different-credential') {
      const email = error?.customData?.email
      if (email) {
        const signInMethods = await fetchSignInMethodsForEmail(auth, email)
        if (signInMethods.length > 0) {
          const firstSignInMethod = signInMethods[0]

          if (firstSignInMethod === EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD) {
            const password = prompt(
              `An account with this email already exists. Please enter the password for ${email} to link accounts.`,
            )
            if (password) {
              try {
                const emailCredential = EmailAuthProvider.credential(email, password)
                const userCredential = await signInWithCredential(auth, emailCredential)
                const credential = GithubAuthProvider?.credentialFromError(error) as AuthCredential
                await linkWithCredential(userCredential.user, credential)
                console.log('Accounts linked successfully')
                return true
              } catch (linkError) {
                console.error('Error during account linking', linkError)
              }
            }
          } else {
            const pendingCred = GithubAuthProvider.credentialFromError(error) as AuthCredential
            try {
              const userCredential = await signInWithPopup(auth, new GithubAuthProvider())
              await linkWithCredential(userCredential.user, pendingCred)
              console.log('Accounts linked successfully')
              return true
            } catch (linkError) {
              console.error('Error during account linking', linkError)
            }
          }
        }
      }
    } else {
      console.error('Error during sign in:', error)
    }
    return false
  }
}

// 用户登录
const loginUser = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    console.log('User logged in successfully.')
    return true
  } catch (error) {
    console.error('Error logging in user:', error)
    return false
  }
}

// 用户注册
const registerUser = async (email: string, password: string) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password)
    console.log('User registered successfully.')
    return true
  } catch (error) {
    console.error('Error registering user:', error)
    return false
  }
}

// 用户注销
const logoutUser = async () => {
  try {
    await signOut(auth)
    console.log('User logged out successfully.')
    return true
  } catch (error) {
    console.error('Error logging out user:', error)
  }
  return null
}

export { auth, loginUser, registerUser, logoutUser }
