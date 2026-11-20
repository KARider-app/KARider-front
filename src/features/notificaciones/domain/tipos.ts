export interface ClaveVapid {
  publicKey: string | null
  habilitado: boolean
}

export interface SuscripcionPushRequest {
  endpoint: string
  p256dh: string
  auth: string
}
