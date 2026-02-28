import { ref, onMounted, onUnmounted, type ComputedRef } from 'vue'

export function useLocks(resourceId: ComputedRef<string | undefined>) {
  const isLockedByMe = ref(false)
  const isLockedByOther = ref(false)
  const lockOwner = ref<string | null>(null)
  const lockExpiresAt = ref<Date | null>(null)
  let timer: ReturnType<typeof setInterval> | null = null

  async function acquireLock() {
    if (!resourceId.value || resourceId.value === 'create') return
    try {
      const data = await $fetch<{ userName: string, expiresAt: string }>(`/api/locks/${resourceId.value}`, { method: 'POST' })
      isLockedByMe.value = true
      isLockedByOther.value = false
      lockOwner.value = data.userName
      lockExpiresAt.value = new Date(data.expiresAt)
    } catch (e: any) {
      if (e.statusCode === 409) {
        isLockedByOther.value = true
        isLockedByMe.value = false
        const lockData = e.data as { userName: string, expiresAt: string } | undefined
        lockOwner.value = lockData?.userName || 'Autre utilisateur'
        lockExpiresAt.value = lockData?.expiresAt ? new Date(lockData.expiresAt) : null
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
    timer = setInterval(() => {
      if (isLockedByMe.value) {
        acquireLock()
      }
    }, 4 * 60 * 1000)
  }

  function stopRenewal() {
    if (timer) clearInterval(timer)
  }

  onMounted(() => {
    if (resourceId.value) {
      acquireLock().then(() => startRenewal())
    }
  })

  onUnmounted(() => {
    stopRenewal()
    releaseLock()
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
