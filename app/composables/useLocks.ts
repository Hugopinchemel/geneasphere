import { type ComputedRef, onMounted, onUnmounted, ref } from 'vue'

export function useLocks(resourceId: ComputedRef<string | undefined>) {
  const isLockedByMe = ref(false)
  const isLockedByOther = ref(false)
  const lockOwner = ref<string | null>(null)
  const lockExpiresAt = ref<Date | null>(null)
  let timer: ReturnType<typeof setInterval> | null = null

  async function acquireLock() {
    if (!resourceId.value || resourceId.value === 'create') return
    try {
      const data = await $fetch<{
        userName: string
        expiresAt: string
      }>(`/api/locks/${resourceId.value}`, { method: 'POST' })
      isLockedByMe.value = true
      isLockedByOther.value = false
      lockOwner.value = data.userName
      lockExpiresAt.value = new Date(data.expiresAt)
    } catch (e: unknown) {
      const err = e as { statusCode?: number, data?: { userName?: string, expiresAt?: string } }
      if (err.statusCode === 409) {
        isLockedByOther.value = true
        isLockedByMe.value = false
        lockOwner.value = err.data?.userName ?? 'Autre utilisateur'
        lockExpiresAt.value = err.data?.expiresAt ? new Date(err.data.expiresAt) : null
      }
    }
  }

  async function releaseLock() {
    if (!resourceId.value || !isLockedByMe.value) return
    try {
      await $fetch(`/api/locks/${resourceId.value}`, { method: 'DELETE' })
      isLockedByMe.value = false
    } catch {
      // Ignored
    }
  }

  function startRenewal() {
    stopRenewal()
    // Renouveler toutes les 4 minutes
    timer = setInterval(async () => {
      if (isLockedByMe.value) {
        await acquireLock()
      }
    }, 4 * 60 * 1000)
  }

  function stopRenewal() {
    if (timer) clearInterval(timer)
  }

  onMounted(async () => {
    if (resourceId.value) {
      await acquireLock()
      startRenewal()
    }
  })

  onUnmounted(async () => {
    stopRenewal()
    await releaseLock()
  })

  return {
    isLockedByMe,
    isLockedByOther,
    lockOwner,
    lockExpiresAt,
    acquireLock,
    releaseLock
  }
}
