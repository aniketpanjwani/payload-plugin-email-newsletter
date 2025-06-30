import type { PayloadRequest } from 'payload'
import jwt from 'jsonwebtoken'

// Next.js types - these are optional and only used when Next.js is available
interface NextApiRequest {
  cookies?: { [key: string]: string }
  headers?: { [key: string]: string | string[] | undefined }
  [key: string]: any
}

interface GetServerSidePropsContext {
  req: {
    cookies?: { [key: string]: string }
    headers?: { [key: string]: string | string[] | undefined }
    [key: string]: any
  }
  [key: string]: any
}

interface TokenPayload {
  id: string
  email: string
  type?: string
  iat?: number
  exp?: number
}

/**
 * Extract token from request cookies
 */
export const getTokenFromRequest = (
  req: NextApiRequest | GetServerSidePropsContext['req'] | PayloadRequest
): string | null => {
  // Handle different request types
  const cookies = (req as any).cookies || (req as any).headers?.cookie
  
  if (!cookies) return null
  
  // Parse cookies if it's a string
  if (typeof cookies === 'string') {
    const parsed = cookies.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    return parsed['newsletter-auth'] || null
  }
  
  // Direct cookie object
  return cookies['newsletter-auth'] || null
}

/**
 * Verify JWT token
 */
export const verifyToken = (
  token: string, 
  secret: string
): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, secret) as TokenPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * Get authentication state for server-side rendering
 */
export const getServerSideAuth = async (
  context: GetServerSidePropsContext,
  secret?: string
): Promise<{ subscriber: TokenPayload | null; isAuthenticated: boolean }> => {
  const token = getTokenFromRequest(context.req)
  
  if (!token) {
    return { subscriber: null, isAuthenticated: false }
  }
  
  const payloadSecret = secret || process.env.PAYLOAD_SECRET
  if (!payloadSecret) {
    console.error('No secret provided for token verification')
    return { subscriber: null, isAuthenticated: false }
  }
  
  const decoded = verifyToken(token, payloadSecret)
  
  if (!decoded) {
    return { subscriber: null, isAuthenticated: false }
  }
  
  return {
    subscriber: decoded,
    isAuthenticated: true,
  }
}

/**
 * Higher-order function for protecting pages
 */
export const requireAuth = <P extends { [key: string]: any }>(
  gssp?: (context: GetServerSidePropsContext) => Promise<{ props: P }>
) => {
  return async (context: GetServerSidePropsContext) => {
    const { isAuthenticated, subscriber } = await getServerSideAuth(context)
    
    if (!isAuthenticated) {
      return {
        redirect: {
          destination: '/auth/signin',
          permanent: false,
        },
      }
    }
    
    // If there's a custom getServerSideProps, run it
    if (gssp) {
      const result = await gssp(context)
      return {
        ...result,
        props: {
          ...result.props,
          subscriber,
        },
      }
    }
    
    // Otherwise just return the subscriber
    return {
      props: {
        subscriber,
      } as any as P,
    }
  }
}

/**
 * Check if request has valid authentication
 */
export const isAuthenticated = (
  req: PayloadRequest | NextApiRequest,
  secret: string
): boolean => {
  const token = getTokenFromRequest(req)
  if (!token) return false
  
  const decoded = verifyToken(token, secret)
  return !!decoded
}