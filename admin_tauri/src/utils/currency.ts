// Shared currency helper — USD is the base currency, SYP is derived:
// SYP = USD × market exchange rate (from CompanySettings).
// Historical records keep their stored snapshot; live computation is for
// entry forms and current-rate display only.
import { ApiClient } from '../api/client'

let exchangeRate = 0
let loaded = false

export async function loadExchangeRate(api: ApiClient, force = false): Promise<number> {
  if (loaded && !force) return exchangeRate
  try {
    const res = await api.get<any>('/api/settings')
    if (res.success && res.data?.exchangeRate) {
      exchangeRate = Number(res.data.exchangeRate) || 0
      loaded = true
    }
  } catch { /* keep previous value */ }
  return exchangeRate
}

export function getExchangeRate(): number {
  return exchangeRate
}

export function sypFromUsd(usd: number): number {
  return exchangeRate > 0 ? Math.round(usd * exchangeRate) : 0
}

export function usdFromSyp(syp: number): number {
  return exchangeRate > 0 ? Math.round((syp / exchangeRate) * 100) / 100 : 0
}

export function fmtSyp(n: number): string {
  return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(n || 0)
}

export function fmtUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
}

/**
 * Wire a USD/SYP input pair for live two-way auto-fill.
 * Typing USD fills SYP (USD × rate) and vice versa — both stay editable.
 * Programmatic value assignment does not fire input events, so no loop.
 */
export function wireUsdSypPair(usdInput: HTMLInputElement | null, sypInput: HTMLInputElement | null) {
  if (!usdInput || !sypInput) return
  usdInput.addEventListener('input', () => {
    const usd = parseFloat(usdInput.value)
    if (!isNaN(usd) && usd > 0 && exchangeRate > 0) {
      sypInput.value = String(Math.round(usd * exchangeRate))
    }
  })
  sypInput.addEventListener('input', () => {
    const syp = parseFloat(sypInput.value)
    if (!isNaN(syp) && syp > 0 && exchangeRate > 0) {
      usdInput.value = String(Math.round((syp / exchangeRate) * 100) / 100)
    }
  })
}
