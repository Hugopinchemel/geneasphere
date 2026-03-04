# Geneasphere — Codebase Guide

This document explains the two core features of the application: **saving people** and **drawing the family tree**.

---

## 1. Saving People (Persons CRUD)

### Data model — `server/models/Person.ts`

This is the Mongoose schema that defines what a person looks like in MongoDB.

```ts
// server/models/Person.ts

const PersonSchema = new Schema<IPerson>({
  firstName: { type: String, required: true, trim: true }, // mandatory
  lastName:  { type: String, default: '', trim: true },
  sex:       { type: String, enum: ['M', 'F', 'Autre'], required: true },

  birthDate: { type: Date, default: null },
  deathDate: { type: Date, default: null },
  birthPlace: { type: String, default: '', trim: true },
  deathPlace: { type: String, default: '', trim: true },

  photo: { type: String, default: '' }, // stores a URL (from /api/upload)
  notes: { type: String, default: '' },

  // Every person belongs to a team — used to scope all queries
  teamId:    { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true }) // adds createdAt / updatedAt automatically

// Safe singleton pattern: reuse existing model in hot-reload environments
export const PersonModel = models.Person || model<IPerson>('Person', PersonSchema)
```

Every person belongs to a **team**. All API endpoints check that the logged-in user is a member of that team before allowing any operation.

---

### API endpoints — `server/api/persons/`

#### Read all — `GET /api/persons` (`index.get.ts`)

```ts
// server/api/persons/index.get.ts

export default defineEventHandler(async (event) => {
  // 1. Get the logged-in user from the session cookie
  const { user } = await getUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  await connectToDB()

  // 2. Resolve which team to filter by
  let teamId = user.currentTeamId

  // If the session has no team yet, find the first team this user is a member of
  if (!teamId) {
    const team = await TeamModel.findOne({ members: user.id })
    if (team) teamId = team._id.toString()
  }

  // 3. Fallback: no team at all → return only what this user personally created
  if (!teamId) {
    return PersonModel.find({ createdBy: user.id }).sort({ updatedAt: -1 })
  }

  // 4. Normal case: return all persons belonging to the team
  return PersonModel.find({ teamId }).sort({ updatedAt: -1 })
})
```

#### Create — `POST /api/persons` (`index.post.ts`)

```ts
// server/api/persons/index.post.ts

// Zod schema validates the incoming JSON body before it touches the database
const bodySchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'), // required, non-empty
  lastName:  z.string().optional().default(''),
  sex:       z.enum(['M', 'F', 'Autre']),              // only these three values
  birthDate: z.string().optional().nullable(),          // ISO string, converted to Date below
  deathDate: z.string().optional().nullable(),
  birthPlace: z.string().optional().default(''),
  deathPlace: z.string().optional().default(''),
  photo:  z.string().optional().default(''),
  notes:  z.string().optional().default('')
})

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  // readValidatedBody runs bodySchema.parse — throws 400 automatically if invalid
  const body = await readValidatedBody(event, bodySchema.parse)

  await connectToDB()

  // Resolve team (same logic as GET, omitted for brevity)
  let teamId = user.currentTeamId
  if (!teamId) { /* ... find from DB ... */ }
  if (!teamId) throw createError({ statusCode: 400, statusMessage: 'No team selected' })

  // Convert date strings to Date objects before saving
  const person = await PersonModel.create({
    ...body,
    birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
    deathDate: body.deathDate ? new Date(body.deathDate) : undefined,
    teamId,
    createdBy: user.id // always set server-side, never trusted from client
  })

  return person // Mongoose document serialised to JSON automatically
})
```

#### Update — `PUT /api/persons/:id` (`[id].put.ts`)

```ts
// server/api/persons/[id].put.ts

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = getRouterParam(event, 'id')          // the :id from the URL
  const body = await readValidatedBody(event, bodySchema.parse)

  await connectToDB()

  // Find all teams the user belongs to — used to build the authorization filter
  const myTeams   = await TeamModel.find({ members: user.id }).select('_id')
  const myTeamIds = myTeams.map(t => t._id)

  // Atomically update + return the new document in one query
  const person = await PersonModel.findOneAndUpdate(
    {
      _id: id,
      // Authorization: must belong to one of the user's teams, OR be created by them
      $or: [
        { teamId: { $in: myTeamIds } },
        { createdBy: user.id }
      ]
    },
    { ...body, /* dates converted */ },
    { returnDocument: 'after' } // return the updated version, not the old one
  )

  if (!person) throw createError({ statusCode: 404, statusMessage: 'Personne introuvable' })
  return person
})
```

#### Delete — `DELETE /api/persons/:id` (`[id].delete.ts`)

```ts
// server/api/persons/[id].delete.ts

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = getRouterParam(event, 'id')
  await connectToDB()

  const myTeams   = await TeamModel.find({ members: user.id }).select('_id')
  const myTeamIds = myTeams.map(t => t._id)

  // Delete the person (same auth filter as update)
  const person = await PersonModel.findOneAndDelete({
    _id: id,
    $or: [{ teamId: { $in: myTeamIds } }, { createdBy: user.id }]
  })
  if (!person) throw createError({ statusCode: 404, statusMessage: 'Personne introuvable' })

  // ── Cascade cleanup ──────────────────────────────────────────────────────────
  // Remove this person from any matrimonial node where they were listed as a parent
  await MatrimonialNodeModel.updateMany(
    { parents: id },
    { $pull: { parents: id } }
  )
  // Remove from any node where they were listed as a child
  await MatrimonialNodeModel.updateMany(
    { 'children.person': id },
    { $pull: { children: { person: id } } }
  )
  // Clean up nodes that are now completely empty (no parents AND no children)
  await MatrimonialNodeModel.deleteMany({
    parents:  { $size: 0 },
    children: { $size: 0 }
  })
  // ────────────────────────────────────────────────────────────────────────────

  return { success: true }
})
```

---

### Edit locking — `app/composables/useLocks.ts`

The edit page uses this composable to prevent two users from editing the same person simultaneously.

```ts
// app/composables/useLocks.ts (simplified)

export function useLocks(resourceId: ComputedRef<string | undefined>) {
  const isLockedByMe    = ref(false)
  const isLockedByOther = ref(false)
  const lockOwner       = ref<string | null>(null)

  async function acquireLock() {
    try {
      // POST /api/locks/:id — returns 409 if someone else already holds the lock
      const data = await $fetch(`/api/locks/${resourceId.value}`, { method: 'POST' })
      isLockedByMe.value    = true
      isLockedByOther.value = false
      lockOwner.value       = data.userName
    } catch (e: unknown) {
      const err = e as { statusCode?: number, data?: { userName?: string } }
      if (err.statusCode === 409) {
        // Another user is editing — show a warning banner in the UI
        isLockedByOther.value = true
        lockOwner.value       = err.data?.userName ?? 'Autre utilisateur'
      }
    }
  }

  // Called automatically every 4 minutes to keep the lock alive
  function startRenewal() {
    setInterval(() => {
      if (isLockedByMe.value) acquireLock()
    }, 4 * 60 * 1000)
  }

  // Called when the user navigates away from the edit page
  async function releaseLock() {
    await $fetch(`/api/locks/${resourceId.value}`, { method: 'DELETE' })
    isLockedByMe.value = false
  }

  onMounted(() => acquireLock().then(() => startRenewal()))
  onUnmounted(() => releaseLock()) // always release on page leave

  return { isLockedByMe, isLockedByOther, lockOwner, acquireLock, releaseLock }
}
```

---

## 2. Drawing the Family Tree

The tree is built in two steps: **data → tree structure** (composables), then **tree structure → rendered HTML/SVG** (Vue components).

```
Person[] + MatrimonialNode[]
        │
        ├─ useTreeBuilder   →  TreeGroup[]    →  <TreeNode>      (HTML, top-down)
        └─ useAncestorBuilder → AncestorGroup →  <SunburstChart> (SVG, radial)
```

---

### Step 1a — `useTreeBuilder` (`app/composables/useTreeBuilder.ts`)

Builds a **downward** family forest: parents at the top, children below.

```ts
// app/composables/useTreeBuilder.ts

// The output type: one node in the tree
// TreeGroup represents either a couple (persons.length === 2)
// or a single person (persons.length === 1)
interface TreeGroup {
  key:          string           // unique identifier for this group
  persons:      Person[]         // 1 or 2 people
  coupleStatus?: MatrimonialStatus
  children:     { node: TreeGroup; linkType: ChildLinkType }[]
}

function buildTree(persons: Person[], relations: MatrimonialNode[]): TreeGroup[] {
  // Build a fast lookup map: personId → Person object
  const personMap: Record<string, Person> = {}
  persons.forEach(p => (personMap[getId(p)] = p))
  const personIds = new Set(persons.map(p => getId(p)))

  // Keep only relations where at least one parent is in the selected person set
  const relevantRelations = relations.filter(rel =>
    (rel.parents ?? []).some(p => personIds.has(getId(p)))
  )

  // groupPersons maps a group key → the 1 or 2 persons in that group
  // groupChildren maps a group key → list of child person IDs + link type
  const groupPersons:  Record<string, Person[]> = {}
  const groupChildren: Record<string, { id: string, type: ChildLinkType }[]> = {}
  const groupStatus:   Record<string, MatrimonialStatus> = {}

  relevantRelations.forEach((rel) => {
    const parentIds = (rel.parents ?? []).map(getId).filter(id => personIds.has(id))

    // Each relation gets a unique key based on its MongoDB _id
    // This allows the same two people to have multiple relations (e.g. re-married)
    let key: string
    if (parentIds.length >= 2) {
      key = `rel_${rel._id}`           // couple: 2 parents
      groupPersons[key] = parentIds.sort().map(id => personMap[id]!)
    } else if (parentIds.length === 1) {
      key = `rel_solo_${rel._id}`      // single parent
      groupPersons[key] = [personMap[parentIds[0]!]!]
    } else {
      key = `rel_empty_${rel._id}`     // unknown parents (node still has children)
      groupPersons[key] = []
    }
    groupStatus[key] = rel.status

    // Collect children that are also in the selected person set
    const children = (rel.children ?? [])
      .map(c => ({ id: getId(c.person), type: c.linkType ?? 'biologique' }))
      .filter(c => personIds.has(c.id))

    if (!groupChildren[key]) groupChildren[key] = []
    children.forEach(child => {
      // Avoid duplicates in case multiple relations share the same child
      if (!groupChildren[key]!.some(c => c.id === child.id))
        groupChildren[key]!.push(child)
    })
  })

  // Any person not involved in any couple gets their own solo group
  persons.forEach((p) => {
    const id = getId(p)
    if (!inCouple.has(id) && !groupPersons[id])
      groupPersons[id] = [p]
  })

  // A group is a root if none of its persons appear as someone else's child
  const allChildIds = new Set(Object.values(groupChildren).flat().map(c => c.id))
  function isRoot(key: string) {
    return (groupPersons[key] ?? []).every(p => !allChildIds.has(getId(p)))
  }

  // Recursively build a TreeGroup from a group key
  function buildGroup(key: string): TreeGroup {
    return {
      key,
      persons:     groupPersons[key] ?? [],
      coupleStatus: groupStatus[key],
      // For each child person ID, find which group they belong to, then recurse
      children: (groupChildren[key] ?? []).map(childInfo => ({
        node:     buildGroup(findGroupKey(childInfo.id, groupPersons)!),
        linkType: childInfo.type
      }))
    }
  }

  // Start from every root group and build downward
  return Object.keys(groupPersons).filter(isRoot).map(buildGroup)
}
```

**`findConnectedIds`** — expands a starting set to all related persons:

```ts
function findConnectedIds(startIds: string[], relations: MatrimonialNode[]): string[] {
  const connected = new Set<string>(startIds)
  let added = true

  // Keep looping until no new IDs are added in a full pass
  while (added) {
    added = false
    relations.forEach((rel) => {
      const allInRel = [
        ...(rel.parents ?? []).map(getId),
        ...(rel.children ?? []).map(c => getId(c.person))
      ]
      // If any person in this relation is already connected,
      // pull all others in too
      if (allInRel.some(id => connected.has(id))) {
        allInRel.forEach((id) => {
          if (id && !connected.has(id)) { connected.add(id); added = true }
        })
      }
    })
  }

  return Array.from(connected)
}
```

---

### Step 1b — `useAncestorBuilder` (`app/composables/useAncestorBuilder.ts`)

Builds an **upward** ancestor tree used by the Sunburst chart.

```ts
// app/composables/useAncestorBuilder.ts

// Recursive output type
interface AncestorGroup {
  person:  Person
  parents: AncestorGroup[] // [father?, mother?]
}

function buildAncestors(
  targetPerson: Person,
  allPersons:   Person[],
  allRelations: MatrimonialNode[]
): AncestorGroup {
  // Fast lookup map
  const personMap = new Map<string, Person>()
  allPersons.forEach(p => personMap.set(getId(p), p))

  function getParents(personId: string): Person[] {
    // Find the matrimonial node where this person is listed as a CHILD
    // (not as a parent — that would give their children, not their parents)
    const node = allRelations.find(rel =>
      (rel.children ?? []).some(c => getId(c.person) === personId)
    )
    if (!node) return []
    return (node.parents ?? [])
      .map(p => personMap.get(getId(p)))
      .filter((p): p is Person => Boolean(p))
  }

  function buildRecursive(person: Person, depth = 0): AncestorGroup {
    if (depth > 10) return { person, parents: [] } // safety cap

    const rawParents = getParents(getId(person))

    // Try to split by sex for a symmetric sunburst (father left, mother right)
    const father = rawParents.find(p => p.sex === 'M')
    const mother = rawParents.find(p => p.sex === 'F')

    const parents: AncestorGroup[] = []
    if (father) parents.push(buildRecursive(father, depth + 1))
    if (mother) parents.push(buildRecursive(mother, depth + 1))

    // If sex-based split failed, fall back to the raw list
    if (parents.length === 0 && rawParents.length > 0)
      rawParents.forEach(p => parents.push(buildRecursive(p, depth + 1)))

    return { person, parents }
  }

  return buildRecursive(targetPerson)
}
```

---

### Step 2a — `TreeNode.vue` (`app/components/tree/TreeNode.vue`)

A **recursive** Vue component. Receives one `TreeGroup` and renders the whole subtree below it.

```vue
<!-- app/components/tree/TreeNode.vue -->
<script lang="ts" setup>
// Props: one group (couple or solo person + their children)
const props = defineProps<{ group: TreeGroup }>()
const emit  = defineEmits(['click-person'])

// Color-code cards by sex
function sexCardClass(person: Person) {
  if (person.sex === 'M') return 'ring-2 ring-blue-500 bg-blue-50/50'
  if (person.sex === 'F') return 'ring-2 ring-pink-500 bg-pink-50/50'
  return 'ring-1 ring-gray-300 bg-default'
}

// Choose the vertical connector line style based on how the child is linked
function childLinkClass(linkType: string) {
  const divorced = isDivorced.value ? 'border-dashed border-red-500' : ''
  if (linkType === 'adoption')   return `${divorced} border-l-4 border-black`  // thick black
  if (linkType === 'gpa')        return `${divorced} border-l-4 border-blue-600` // thick blue
  if (linkType === 'biologique') return `${divorced} border-l-4 border-green-500` // thin green
  return 'w-1 bg-gray-400'
}

// Icons for each couple status
const statusIcon: Record<string, string> = {
  marié:      'i-lucide-rings-wedding',
  divorcé:    'i-lucide-heart-crack',
  pacsé:      'i-lucide-handshake',
  union_libre: 'i-lucide-heart',
  inconnu:    'i-lucide-circle-help'
}

const isCouple   = computed(() => props.group.persons.length >= 2)
const isDivorced = computed(() => props.group.coupleStatus === 'divorcé')
</script>

<template>
  <div class="flex flex-col items-center">

    <!-- ── The couple / solo card ── -->
    <div class="flex items-center">

      <!-- Person 1 card (always shown if it exists) -->
      <div
        v-if="group.persons[0]"
        :class="sexCardClass(group.persons[0])"
        class="rounded-xl w-32 p-3 cursor-pointer"
        @click="emit('click-person', group.persons[0])"  <!-- bubble up to dashboard -->
      >
        <UAvatar :src="group.persons[0].photo" />
        <p>{{ group.persons[0].firstName }}</p>
        <!-- birth – death years -->
      </div>

      <!-- Couple connector: icon + dashed line for divorced -->
      <template v-if="isCouple">
        <UIcon :name="coupleIcon" />
        <!-- Person 2 card -->
        <div
          :class="sexCardClass(group.persons[1])"
          class="rounded-xl w-32 p-3 cursor-pointer"
          @click="emit('click-person', group.persons[1])"
        >...</div>
      </template>
    </div>

    <!-- ── Children ── -->
    <template v-if="group.children.length">
      <!-- Vertical stem line from the couple down -->
      <div class="h-8 w-1 bg-gray-400" />

      <div class="flex gap-12">
        <div v-for="child in group.children" :key="child.node.key">
          <!-- Coloured connector line (biological / adoption / gpa) -->
          <div :class="[childLinkClass(child.linkType), 'h-8']" />

          <!--
            Recursion: TreeNode renders itself for each child group.
            This continues until a group has no children left.
          -->
          <TreeNode
            :group="child.node"
            @click-person="emit('click-person', $event)"
          />
        </div>
      </div>
    </template>

  </div>
</template>
```

---

### Step 2b — `SunburstChart.vue` (`app/components/tree/SunburstChart.vue`)

A D3-based radial diagram. Each concentric ring is one generation further back.

```vue
<!-- app/components/tree/SunburstChart.vue -->
<script lang="ts" setup>
import { hierarchy, partition } from 'd3-hierarchy'
import { arc as d3Arc }         from 'd3-shape'

const props = defineProps<{ data: AncestorGroup }>()
const emit  = defineEmits(['select'])

// ── 1. Convert AncestorGroup tree → D3-compatible plain object ────────────────
function transformData(node: AncestorGroup, depth = 0): D3Node {
  const children: D3Node[] = []

  const father = node.parents.find(p => p.person.sex === 'M')
  const mother = node.parents.find(p => p.person.sex === 'F')

  // Father goes on the left half, mother on the right half
  // If a parent is unknown, insert a grey placeholder ("Inconnu") up to depth 4
  if (father) children.push(transformData(father, depth + 1))
  else if (depth < 4)
    children.push({ person: { firstName: 'Inconnu', sex: 'M' } as Person, isDummy: true })

  if (mother) children.push(transformData(mother, depth + 1))
  else if (depth < 4)
    children.push({ person: { firstName: 'Inconnu', sex: 'F' } as Person, isDummy: true })

  return { person: node.person, children: children.length ? children : undefined }
}

// ── 2. Build D3 layout ────────────────────────────────────────────────────────
const root = computed(() => {
  const d3Data = transformData(props.data)

  // hierarchy() adds depth, parent, children accessors to each node
  const h = hierarchy<D3Node>(d3Data)
    .sum(d => (!d.children || d.children.length === 0) ? 1 : 0)
    // Only leaf nodes get weight = 1; all arcs end up the same angular size

  // partition() converts the hierarchy into [x0, x1, y0, y1] polar coordinates
  // size([2π, radius]) means x spans the full circle, y spans 0..250
  return partition<D3Node>().size([2 * Math.PI, 250])(h)
})

// ── 3. Arc generator ──────────────────────────────────────────────────────────
// d3Arc() takes the rectangular coordinates and draws an SVG arc path
const arcGenerator = d3Arc<HierarchyRectangularNode<D3Node>>()
  .startAngle(d => d.x0)      // angular start of the slice
  .endAngle(d => d.x1)        // angular end
  .innerRadius(d => d.y0)     // inner ring radius (= generation depth)
  .outerRadius(d => d.y1 - 1) // outer ring radius
  .padAngle(0.005)             // tiny gap between slices

// ── 4. Colour by sex ─────────────────────────────────────────────────────────
const color = (person: Person) => {
  if (person.sex === 'M') return '#3b82f6' // blue-500
  if (person.sex === 'F') return '#ec4899' // pink-500
  return '#9ca3af'                          // gray-400
}

// ── 5. Rotate text labels to follow the arc ───────────────────────────────────
function getTextTransform(node: HierarchyRectangularNode<D3Node>) {
  const angleDeg = (((node.x0 + node.x1) / 2) * 180) / Math.PI // mid-angle in degrees
  const r        = (node.y0 + node.y1) / 2                       // mid-radius
  // rotate to the arc angle, translate outward, then flip text on the bottom half
  return `rotate(${angleDeg - 90}) translate(${r},0) rotate(${angleDeg < 180 ? 0 : 180})`
}
</script>

<template>
  <svg :viewBox="`-250 -250 500 500`" width="500" height="500">
    <g>
      <g
        v-for="(node, i) in root.descendants()"
        :key="node.data.person._id + i"
        @click="emit('select', node.data.person)" <!-- clicking a slice navigates to that ancestor -->
      >
        <!-- The coloured arc slice (not rendered for placeholder "Inconnu" nodes) -->
        <path
          v-if="!node.data.isDummy"
          :d="arcGenerator(node)"        <!-- SVG path string computed by d3Arc -->
          :fill="color(node.data.person)"
        />

        <!-- Text label — only shown if the arc is wide enough to fit text -->
        <text
          v-if="!node.data.isDummy && node.depth > 0 && (node.x1 - node.x0) > 0.15"
          :transform="getTextTransform(node)"
          text-anchor="middle"
        >
          {{ node.data.person.firstName }} {{ node.data.person.lastName }}
        </text>

        <!-- The centre circle label (depth === 0 = the subject person) -->
        <text v-if="node.depth === 0" text-anchor="middle">
          <tspan x="0" dy="-0.3em">{{ node.data.person.firstName }}</tspan>
          <tspan x="0" dy="1.2em">{{ node.data.person.lastName }}</tspan>
        </text>
      </g>
    </g>
  </svg>
</template>
```

---

### Data flow summary

```
MongoDB
  └── GET /api/persons              → allPersons[]
  └── GET /api/matrimonial-nodes    → allRelations[]

Dashboard page
  │
  ├─ useTreeBuilder.buildTree(selectedPersons, allRelations)
  │     └── TreeGroup[]
  │           └── <TreeNode group="...">          ← recursive, top-down HTML tree
  │                 emits 'click-person'
  │                       │
  └─────────────────────────────────────────────────────────
                          │
  useAncestorBuilder.buildAncestors(person, allPersons, allRelations)
        └── AncestorGroup
              └── <SunburstChart data="...">      ← D3 SVG radial chart
                    emits 'select' (navigate to another ancestor)
```
