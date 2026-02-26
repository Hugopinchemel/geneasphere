import type { MatrimonialNode, MatrimonialStatus, Person, TreeGroup } from '~/types'

export function useTreeBuilder() {
  function getId(v: unknown): string {
    if (!v) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>
      if (obj._id !== undefined) return String(obj._id)
    }
    return String(v)
  }

  /**
   * Construit une forêt de TreeGroup à partir d'une liste de personnes
   * et de nœuds matrimoniaux filtrés sur ceux-ci.
   */
  function buildTree(persons: Person[], relations: MatrimonialNode[]): TreeGroup[] {
    const personMap: Record<string, Person> = {}
    persons.forEach(p => (personMap[getId(p)] = p))
    const personIds = new Set(persons.map(p => getId(p)))

    // Nœuds matrimoniaux dont au moins un parent est dans la sélection
    const relevantRelations = relations.filter((rel) => {
      return (rel.parents ?? []).some(p => personIds.has(getId(p)))
    })

    const groupChildren: Record<string, string[]> = {}
    const groupPersons: Record<string, Person[]> = {}
    const groupStatus: Record<string, MatrimonialStatus> = {}

    // Ensemble des ids déjà dans un groupe couple
    const inCouple = new Set<string>()

    relevantRelations.forEach((rel) => {
      const parentIds = (rel.parents ?? []).map(getId).filter(id => id && personIds.has(id))
      if (parentIds.length === 0) return

      let key: string
      if (parentIds.length >= 2) {
        // Couple : trier pour clé stable
        const sorted = [...parentIds].sort()
        key = sorted.join('__')
        sorted.forEach(id => inCouple.add(id))
        groupPersons[key] = sorted.map(id => personMap[id]).filter((p): p is Person => Boolean(p))
        groupStatus[key] = rel.status
      } else {
        // Un seul parent connu dans la sélection
        key = parentIds[0]!
        if (!groupPersons[key]) {
          groupPersons[key] = [personMap[key]!].filter((p): p is Person => Boolean(p))
        }
      }

      const childIds = (rel.children ?? []).map(c => getId(c.person)).filter(id => id && personIds.has(id))
      if (!groupChildren[key]) groupChildren[key] = []
      childIds.forEach((cid) => {
        if (!groupChildren[key]!.includes(cid)) groupChildren[key]!.push(cid)
      })
    })

    // Personnes solo (pas dans un couple)
    persons.forEach((p) => {
      const id = getId(p)
      if (!inCouple.has(id) && !groupPersons[id]) {
        groupPersons[id] = [p]
      }
    })

    // Tous les ids enfants (pour trouver les racines)
    const allChildIds = new Set<string>(Object.values(groupChildren).flat())

    // Une clé de groupe est racine si aucune des personnes du groupe n'est enfant
    function isRoot(key: string): boolean {
      return (groupPersons[key] ?? []).every(p => !allChildIds.has(getId(p)))
    }

    // Construire récursivement un TreeGroup depuis une clé groupe
    const built = new Set<string>()
    function buildGroup(key: string): TreeGroup {
      built.add(key)
      const childGroupKeys = new Set<string>()
      ;(groupChildren[key] ?? []).forEach((childId) => {
        const groupKey = findGroupKey(childId, groupPersons)
        if (groupKey) childGroupKeys.add(groupKey)
      })

      return {
        key,
        persons: groupPersons[key] ?? [],
        coupleStatus: groupStatus[key],
        children: [...childGroupKeys]
          .filter(k => k !== key)
          .map(k => buildGroup(k))
      }
    }

    const roots = Object.keys(groupPersons).filter(isRoot)
    return roots.map(k => buildGroup(k))
  }

  return { buildTree, getId }
}

function findGroupKey(
  personId: string,
  groupPersons: Record<string, Person[]>
): string | null {
  for (const [key, persons] of Object.entries(groupPersons)) {
    if (persons.some((p) => {
      const id = p?._id ?? (p as unknown as string)
      return String(id) === personId
    })) return key
  }
  return null
}
