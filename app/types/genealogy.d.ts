export type Sex = 'M' | 'F' | 'Autre'
export type MatrimonialStatus = 'married' | 'divorced' | 'pacsed' | 'union' | 'union_libre' | 'inconnu'
export type ChildLinkType = 'biologique' | 'adoption' | 'gpa'

export interface Person {
  _id: string
  firstName: string
  lastName: string
  sex: Sex
  birthDate?: string | null
  deathDate?: string | null
  birthPlace?: string
  deathPlace?: string
  photo?: string
  notes?: string
  teamId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface MatrimonialChild {
  person: string | Person
  linkType: ChildLinkType
}

export interface MatrimonialNode {
  _id: string
  status: MatrimonialStatus
  startDate?: string | null
  endDate?: string | null
  parents: (string | Person)[]
  children: MatrimonialChild[]
  teamId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** Un nœud de rendu de l'arbre : soit un individu seul, soit un couple */
export interface TreeGroup {
  /** Clé unique du groupe (id personne seule, ou "idA__idB" pour un couple) */
  key: string
  /** Personnes du groupe (1 ou 2) */
  persons: Person[]
  /** Statut matrimonial si couple */
  coupleStatus?: MatrimonialStatus
  /** Enfants directs de ce groupe avec type de lien */
  children: {
    node: TreeGroup
    linkType: ChildLinkType
  }[]
}
