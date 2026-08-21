const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const TOKEN_KEY = 'kesh-token'
const USER_KEY = 'kesh-user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

function saveAuth(authResponse) {
  localStorage.setItem(TOKEN_KEY, authResponse.token)
  localStorage.setItem(USER_KEY, JSON.stringify({
    username: authResponse.username,
    email: authResponse.email,
  }))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Thrown when the backend rejects a request as unauthorized (bad/expired token). */
export class AuthError extends Error {}

async function authedFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), ...authHeaders() },
  })
  if (res.status === 401 || res.status === 403) {
    clearAuth()
    throw new AuthError('Session expired — please log in again.')
  }
  return res
}

export async function signup(username, email, password) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Signup failed')
  saveAuth(data)
  return data
}

export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  saveAuth(data)
  return data
}

export async function sendMessage(message, sessionId, mode = 'auto', responseStyle = 'balanced') {
  const res = await authedFetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, mode, responseStyle }),
  })
  if (!res.ok) throw new Error(`Backend error: ${res.status}`)
  return res.json() // { reply, brainUsed, sessionId }
}

export async function getSessions() {
  const res = await authedFetch(`${BASE_URL}/sessions`)
  if (!res.ok) throw new Error(`Backend error: ${res.status}`)
  return res.json()
}

export async function getHistory(sessionId) {
  const res = await authedFetch(`${BASE_URL}/chat/${sessionId}/history`)
  if (!res.ok) throw new Error(`Backend error: ${res.status}`)
  return res.json()
}

export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`)
    return res.ok
  } catch {
    return false
  }
}
