import { Login as LoginComponent } from '@quelyos/ui'
import { useAuth } from '@/lib/team/compat/auth'
import { branding } from '@/config/branding'

export default function Login() {
  return <LoginComponent useAuth={useAuth} branding={branding} />
}
