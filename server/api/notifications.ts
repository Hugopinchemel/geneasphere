import { sub } from 'date-fns'

const notifications = [{
  id: 1,
  unread: true,
  sender: {
    id: 101,
    name: 'Sophie Martin',
    email: 'sophie.martin@example.com',
    avatar: { src: 'https://i.pravatar.cc/128?u=sophie' },
    status: 'subscribed',
    location: 'Paris, France'
  },
  body: 'a ajouté un nouveau membre à l\'arbre',
  date: sub(new Date(), { minutes: 23 }).toISOString()
}, {
  id: 2,
  unread: true,
  sender: {
    id: 102,
    name: 'Lucas Bernard',
    email: 'lucas.bernard@example.com',
    avatar: { src: 'https://i.pravatar.cc/128?u=lucas' },
    status: 'subscribed',
    location: 'Lyon, France'
  },
  body: 'vous a invité dans son équipe',
  date: sub(new Date(), { hours: 1 }).toISOString()
}, {
  id: 3,
  unread: true,
  sender: {
    id: 103,
    name: 'Emma Lefebvre',
    email: 'emma.lefebvre@example.com',
    avatar: { src: 'https://i.pravatar.cc/128?u=emma' },
    status: 'subscribed',
    location: 'Bordeaux, France'
  },
  body: 'vous a envoyé un message',
  date: sub(new Date(), { hours: 3 }).toISOString()
}, {
  id: 4,
  unread: false,
  sender: {
    id: 105,
    name: 'Thomas Petit',
    email: 'thomas.petit@example.com',
    avatar: { src: 'https://i.pravatar.cc/128?u=thomas' },
    status: 'subscribed',
    location: 'Marseille, France'
  },
  body: 'a modifié un nœud matrimonial',
  date: sub(new Date(), { days: 3 }).toISOString()
}, {
  id: 5,
  unread: false,
  sender: {
    id: 106,
    name: 'Isabelle Dubois',
    email: 'isabelle.dubois@example.com',
    avatar: { src: 'https://i.pravatar.cc/128?u=isabelle' },
    status: 'subscribed',
    location: 'Nantes, France'
  },
  body: 'souhaite partager des documents avec vous',
  date: sub(new Date(), { days: 7 }).toISOString()
}]

export default eventHandler(async () => {
  return notifications
})
