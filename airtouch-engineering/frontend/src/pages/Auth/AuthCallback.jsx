import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../services/supabase.js'
import { ensureProfile } from '../../services/auth.js'

function getSafeRedirect(nextParam) {
  if (!nextParam || typeof nextParam !== 'string') return '/account'
  // Only accept relative paths starting with a single '/'
  if (nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes(':')) {
    return nextParam
  }
  return '/account'
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let active = true

    async function handleOAuthCallback() {
      try {
        // Wait for Supabase to exchange hash or code for session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          // If session is not immediately ready, listen once for SIGNED_IN
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === 'SIGNED_IN' && newSession) {
              subscription.unsubscribe()
              await finalizeLogin(newSession)
            }
          })
          return
        }

        await finalizeLogin(session)
      } catch (err) {
        if (active) {
          console.error('[OAuth Callback Error]:', err)
          setErrorMsg('Authentication failed. Redirecting to login...')
          setTimeout(() => navigate('/auth', { replace: true }), 2500)
        }
      }
    }

    async function finalizeLogin(session) {
      if (!active) return

      // Call backend to ensure profile row exists in PostgreSQL
      if (session.access_token) {
        await ensureProfile(session.access_token).catch(() => {})
      }

      const nextParam = searchParams.get('next')
      const targetUrl = getSafeRedirect(nextParam)

      navigate(targetUrl, { replace: true })
    }

    handleOAuthCallback()

    return () => {
      active = false
    }
  }, [navigate, searchParams])

  return (
    <main className="min-h-[75vh] flex items-center justify-center bg-zinc-950 px-4">
      <div className="text-center max-w-sm w-full p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-2xl">
        {errorMsg ? (
          <div>
            <p className="text-rose-400 font-bold text-sm mb-2" role="alert">
              {errorMsg}
            </p>
            <p className="text-xs text-zinc-500">Please wait while we redirect you...</p>
          </div>
        ) : (
          <div>
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
            <h1 className="text-base font-bold text-white tracking-wide">
              Completing Google Sign-In...
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Securing your session with AirTouch Engineering
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

