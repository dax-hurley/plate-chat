import { CredentialsSignin } from "next-auth";

/** Thrown when email or password is missing in the credentials callback */
export class CredentialsMissingFields extends CredentialsSignin {
  code = "missing_fields";
}

/** No user row for this email */
export class CredentialsNoAccount extends CredentialsSignin {
  code = "no_account";
}

/** User exists but password does not match */
export class CredentialsWrongPassword extends CredentialsSignin {
  code = "wrong_password";
}

/** User exists (e.g. OAuth) but has no password set for credentials sign-in */
export class CredentialsNoPasswordSet extends CredentialsSignin {
  code = "no_password_set";
}

export function credentialsSignInErrorMessage(code: string | undefined): string {
  switch (code) {
    case "missing_fields":
      return "Enter your email and password.";
    case "no_account":
      return "No account for that email. Check the spelling or create an account.";
    case "wrong_password":
      return "Incorrect password. Try again.";
    case "no_password_set":
      return "This account does not use a password here. Sign in with the method you used when you registered.";
    case "credentials":
    default:
      return "We could not sign you in. Check your email and password and try again.";
  }
}
