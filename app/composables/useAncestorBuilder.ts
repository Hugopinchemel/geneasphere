import type {MatrimonialNode, Person} from '~/types'

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

  function buildAncestors(targetPerson: Person, allPersons: Person[], allRelations: MatrimonialNode[]): AncestorGroup {
    const personMap = new Map<string, Person>()
    allPersons.forEach(p => personMap.set(getId(p), p))

    function getParents(personId: string): Person[] {
      // Un nœud matrimonial où la personne est un enfant
      const node = allRelations.find(rel =>
        (rel.children ?? []).some(c => getId(c.person) === personId)
      )
      if (!node) return []
      return (node.parents ?? [])
        .map(p => personMap.get(getId(p)))
        .filter((p): p is Person => Boolean(p))
    }

    function buildRecursive(person: Person, depth = 0): AncestorGroup {
      if (depth > 10) return {person, parents: []} // Limite de sécurité

      const rawParents = getParents(getId(person))
      const parents: AncestorGroup[] = []

      // On s'assure d'avoir exactement deux emplacements pour les parents au premier niveau de récursion
      // pour garantir la symétrie du sunburst (père/mère).
      // On peut essayer de deviner qui est le père et qui est la mère par le sexe.
      const father = rawParents.find(p => p.sex === 'M')
      const mother = rawParents.find(p => p.sex === 'F')

      if (father) {
        parents.push(buildRecursive(father, depth + 1))
      } else if (depth < 5) {
        // Ajouter un parent fantôme si on veut forcer la symétrie parfaite même si inconnu ?
        // Pour l'instant on garde les parents réels.
      }

      if (mother) {
        parents.push(buildRecursive(mother, depth + 1))
      }

      // Si on n'a pas pu identifier par le sexe, on prend les parents tels quels
      if (parents.length === 0 && rawParents.length > 0) {
        rawParents.forEach(p => parents.push(buildRecursive(p, depth + 1)))
      }

      return {
        person,
        parents
      }
    }

    return buildRecursive(targetPerson)
  }

  return {buildAncestors, getId}
}
