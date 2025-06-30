// SignIn is just an alias for MagicLink with slightly different defaults
import React from 'react'
import { MagicLinkEmail, MagicLinkEmailProps } from './MagicLink'

export const SignInEmail: React.FC<MagicLinkEmailProps> = (props) => {
  return <MagicLinkEmail {...props} />
}

export default SignInEmail