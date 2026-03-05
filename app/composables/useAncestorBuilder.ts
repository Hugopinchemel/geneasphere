import type { MatrimonialNode, Person } from '~/types'

export interface AncestorGroup {
  person: Person
  parents: AncestorGroup[]
}

export function useAncestorBuilder() {
  function getId(v: unknown): string {
    if (!v) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>
      if (obj._id !== undefined) return String(obj._id)
    }
    return String(v)
  }

  function buildAncestors(target: Person, allPersons: Person[], allRelations: MatrimonialNode[]): AncestorGroup {
    const personMap = new Map<string, Person>()
    allPersons.forEach(p => personMap.set(getId(p), p))

    function findParents(personId: string): Person[] {
      const node = allRelations.find(rel =>
        (rel.children ?? []).some(c => getId(c.person) === personId)
      )
      if (!node) return []
      return (node.parents ?? [])
        .map(p => personMap.get(getId(p)))
        .filter((p): p is Person => Boolean(p))
    }

    function buildRecursive(person: Person, depth = 0): AncestorGroup {
      if (depth > 10) return { person, parents: [] }

      const rawParents = findParents(getId(person))
      const parents: AncestorGroup[] = []

      const father = rawParents.find(p => p.sex === 'M')
      const mother = rawParents.find(p => p.sex === 'F')

      if (father) parents.push(buildRecursive(father, depth + 1))
      if (mother) parents.push(buildRecursive(mother, depth + 1))

      if (parents.length === 0 && rawParents.length > 0) {
        rawParents.forEach(p => parents.push(buildRecursive(p, depth + 1)))
      }

      return { person, parents }
    }

    return buildRecursive(target)
  }

  return { buildAncestors, getId }
}
