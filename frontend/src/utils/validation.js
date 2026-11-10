export function getPasswordStrength(password) {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        punctuation: /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/.test(password),
    }

    const passedCount = Object.values(checks).filter(Boolean).length
    const isValid = Object.values(checks).every(Boolean)

    return { checks, passedCount, isValid }
}