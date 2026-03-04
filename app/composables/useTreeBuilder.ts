import type { ChildLinkType, MatrimonialNode, MatrimonialStatus, Person, TreeGroup } from '~/types'

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
      return (rel.parents ?? []).some(p => personIds.has(getId(p))) || (rel.children ?? []).some(c => personIds.has(getId(c.person)))
    })

    const groupChildren: Record<string, { id: string, type: ChildLinkType }[]> = {}
    const groupPersons: Record<string, Person[]> = {}
    const groupStatus: Record<string, MatrimonialStatus> = {}

    // Ensemble des ids déjà dans un groupe couple
    const inCouple = new Set<string>()

    relevantRelations.forEach((rel) => {
      const parentIds = (rel.parents ?? []).map(getId).filter(id => id && personIds.has(id))

      let key: string
      // Toujours utiliser l'id de la relation pour permettre plusieurs relations pour un même couple (Point 3)
      key = `rel_${rel._id}`

      if (parentIds.length >= 2) {
        const sorted = [...parentIds].sort()
        sorted.forEach(id => inCouple.add(id))
        groupPersons[key] = sorted.map(id => personMap[id]).filter((p): p is Person => Boolean(p))
        groupStatus[key] = rel.status
      } else if (parentIds.length === 1) {
        key = parentIds[0]! // Garder l'id de la personne pour les nœuds solo ?
        // Non, si on veut plusieurs relations pour un parent solo, il faut aussi une clé unique.
        key = `rel_solo_${rel._id}`
        groupPersons[key] = [personMap[parentIds[0]!]!].filter((p): p is Person => Boolean(p))
        groupStatus[key] = rel.status
      } else {
        // Parents vides (Point 2)
        key = `rel_empty_${rel._id}`
        groupPersons[key] = []
        groupStatus[key] = rel.status
      }

      const children = (rel.children ?? [])
        .map(c => ({ id: getId(c.person), type: c.linkType ?? 'biologique' }))
        .filter(c => c.id && personIds.has(c.id))

      if (!groupChildren[key]) groupChildren[key] = []
      children.forEach((child) => {
        if (!groupChildren[key]!.some(c => c.id === child.id)) groupChildren[key]!.push(child)
      })
    })

    // Personnes solo (pas dans un couple)
    const personsAlreadyInGroup = new Set(
      Object.values(groupPersons).flat().map(p => getId(p))
    )

    persons.forEach((p) => {
      const id = getId(p)
      if (!inCouple.has(id) && !personsAlreadyInGroup.has(id)) {
        groupPersons[id] = [p]
      }
    })

    // Tous les ids enfants (pour trouver les racines)
    const allChildIds = new Set<string>(Object.values(groupChildren).flat().map(c => c.id))

    // Une clé de groupe est racine si aucune des personnes du groupe n'est enfant
    function isRoot(key: string): boolean {
      const persons = groupPersons[key] ?? []
      if (persons.length === 0) return true // Un groupe vide est forcément une racine (Point 2)
      return persons.every(p => !allChildIds.has(getId(p)))
    }

    // Construire récursivement un TreeGroup depuis une clé groupe
    const built = new Set<string>()

    function buildGroup(key: string): TreeGroup {
      built.add(key)
      const childrenEntries: { node: TreeGroup, linkType: ChildLinkType }[] = []

      ;(groupChildren[key] ?? []).forEach((childInfo) => {
        const groupKey = findGroupKey(childInfo.id, groupPersons)
        if (groupKey && !built.has(groupKey)) {
          childrenEntries.push({
            node: buildGroup(groupKey),
            linkType: childInfo.type
          })
        }
      })

      return {
        key,
        persons: groupPersons[key] ?? [],
        coupleStatus: groupStatus[key],
        children: childrenEntries
      }
    }

    const roots = Object.keys(groupPersons).filter(isRoot)
    return roots.map(k => buildGroup(k))
  }

  /**
   * Récupère récursivement tous les ids des personnes liées (parents, conjoints, enfants)
   * à partir d'un ensemble d'ids de départ.
   */
  function findConnectedIds(startIds: string[], relations: MatrimonialNode[]): string[] {
    const connected = new Set<string>(startIds)
    let added = true

    while (added) {
      added = false
      relations.forEach((rel) => {
        const parents = (rel.parents ?? []).map(getId)
        const children = (rel.children ?? []).map(c => getId(c.person))
        const allInRel = [...parents, ...children]

        const hasOverlap = allInRel.some(id => connected.has(id))
        if (hasOverlap) {
          allInRel.forEach((id) => {
            if (id && !connected.has(id)) {
              connected.add(id)
              added = true
            }
          })
        }
      })
    }

    return Array.from(connected)
  }

  return { buildTree, findConnectedIds, getId }
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
