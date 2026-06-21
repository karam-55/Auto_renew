// Shared validation utilities for all forms
// Syrian phone: starts with 09 followed by 8 digits

export const PHONE_REGEX = /^09[0-9]{8}$/
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isRequired(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return !isNaN(value)
  return true
}

export function isPhone(value: string): boolean {
  return PHONE_REGEX.test(value.trim())
}

export function isEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}

export function minLength(value: string, min: number): boolean {
  return value.trim().length >= min
}

export function maxLength(value: string, max: number): boolean {
  return value.trim().length <= max
}

export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value > 0
}

export function isNonNegativeNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0
}

export function inRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max
}

export function isValidYear(value: number): boolean {
  const currentYear = new Date().getFullYear()
  return inRange(value, 1900, currentYear + 1)
}

export interface ValidationError {
  field: string
  message: string
}

export function validateFields(
  rules: Array<{ field: string; value: unknown; label: string; validators: Array<{ check: (v: unknown) => boolean; msg: string }> }>
): ValidationError[] {
  const errors: ValidationError[] = []
  for (const rule of rules) {
    for (const validator of rule.validators) {
      if (!validator.check(rule.value)) {
        errors.push({ field: rule.field, message: validator.msg })
        break
      }
    }
  }
  return errors
}

// Show validation errors via toast and highlight fields
export function showValidationErrors(errors: ValidationError[], container: HTMLElement) {
  // Clear previous highlights
  container.querySelectorAll('.validation-error').forEach((el) => {
    el.classList.remove('validation-error', 'border-error', 'ring-error')
    const msg = el.parentElement?.querySelector('.field-error-msg')
    msg?.remove()
  })

  const firstEl = container.querySelector(`[name="${errors[0].field}"], #${errors[0].field}`) as HTMLElement | null
  for (const err of errors) {
    const input = container.querySelector(`[name="${err.field}"], #${err.field}`) as HTMLElement | null
    if (input) {
      input.classList.add('validation-error', 'border-error', 'ring-error')
      // Add error message below input if not already present
      const parent = input.parentElement
      if (parent && !parent.querySelector('.field-error-msg')) {
        const msg = document.createElement('p')
        msg.className = 'field-error-msg text-error text-xs mt-1'
        msg.textContent = err.message
        parent.appendChild(msg)
      }
    }
  }

  // Toast summary
  if ((window as any).toast) {
    ;(window as any).toast.show({
      message: errors.map((e) => e.message).join(' • '),
      type: 'warning',
      duration: 5000,
    })
  }

  // Focus first error
  firstEl?.focus()
}
