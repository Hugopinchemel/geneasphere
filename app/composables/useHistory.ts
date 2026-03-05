export interface HistoryAction {
  libelle?: string
  annuler: () => void | Promise<void>
  retablir: () => void | Promise<void>
}

const MAX_HISTORY = 50

export function useHistory() {
  const past = ref<HistoryAction[]>([])
  const future = ref<HistoryAction[]>([])

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)
  const lastLabel = computed(() => past.value[past.value.length - 1]?.libelle ?? null)
  const nextLabel = computed(() => future.value[future.value.length - 1]?.libelle ?? null)

  function push(action: HistoryAction) {
    past.value.push(action)
    if (past.value.length > MAX_HISTORY) past.value.shift()
    future.value = []
  }

  async function undo() {
    const action = past.value.pop()
    if (!action) return
    await action.annuler()
    future.value.push(action)
  }

  async function redo() {
    const action = future.value.pop()
    if (!action) return
    await action.retablir()
    past.value.push(action)
  }

  return { push, undo, redo, canUndo, canRedo, lastLabel, nextLabel }
}
