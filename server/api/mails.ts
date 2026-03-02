import {sub} from 'date-fns'

const mails = [{
  id: 1,
  unread: true,
  from: {
    id: 101,
    name: 'Sophie Martin',
    email: 'sophie.martin@example.com',
    avatar: {src: 'https://i.pravatar.cc/128?u=sophie'},
    status: 'subscribed',
    location: 'Paris, France'
  },
  subject: 'Nouveau membre dans votre arbre',
  body: `Bonjour,

Je voulais vous informer qu'un nouveau membre a été ajouté à votre arbre généalogique : Marie Dupont, née le 12 mars 1945.

N'hésitez pas à compléter ses informations si vous en avez davantage.

Cordialement,
Sophie`,
  date: sub(new Date(), {minutes: 23}).toISOString()
}, {
  id: 2,
  unread: true,
  from: {
    id: 102,
    name: 'Lucas Bernard',
    email: 'lucas.bernard@example.com',
    avatar: {src: 'https://i.pravatar.cc/128?u=lucas'},
    status: 'subscribed',
    location: 'Lyon, France'
  },
  subject: 'Invitation à rejoindre l\'équipe "Famille Durand"',
  body: `Bonjour,

Lucas Bernard vous invite à rejoindre l'équipe "Famille Durand" sur Geneasphere.

En acceptant, vous pourrez collaborer sur l'arbre généalogique de cette famille et contribuer à enrichir l'histoire commune.

Cordialement,
L'équipe Geneasphere`,
  date: sub(new Date(), {hours: 1}).toISOString()
}, {
  id: 3,
  unread: true,
  from: {
    id: 103,
    name: 'Emma Lefebvre',
    email: 'emma.lefebvre@example.com',
    avatar: {src: 'https://i.pravatar.cc/128?u=emma'},
    status: 'subscribed',
    location: 'Bordeaux, France'
  },
  subject: 'Question sur un ancêtre commun',
  body: `Bonjour,

En explorant votre arbre, j'ai remarqué que nous partageons peut-être un ancêtre commun : Jean-Baptiste Moreau, né vers 1820 à Toulouse.

Auriez-vous des informations sur sa descendance ? Je serais ravie de comparer nos recherches.

Bien cordialement,
Emma`,
  date: sub(new Date(), {hours: 3}).toISOString()
}, {
  id: 4,
  unread: false,
  from: {
    id: 104,
    name: 'Contact Geneasphere',
    email: 'contact@geneasphere.com',
    avatar: {src: undefined},
    status: 'subscribed',
    location: 'France'
  },
  subject: 'Création de compte',
  body: `Bonjour,

Merci de votre inscription sur Geneasphere.
Nous sommes ravis de vous accueillir dans notre communauté de passionnés de généalogie.

Pour commencer, nous vous recommandons de :
- Créer votre premier arbre généalogique
- Ajouter les membres de votre famille
- Inviter d'autres membres pour collaborer

N'hésitez pas à nous contacter si vous avez des questions.

L'équipe Geneasphere`,
  date: sub(new Date(), {days: 1}).toISOString()
}, {
  id: 5,
  unread: false,
  from: {
    id: 105,
    name: 'Thomas Petit',
    email: 'thomas.petit@example.com',
    avatar: {src: 'https://i.pravatar.cc/128?u=thomas'},
    status: 'subscribed',
    location: 'Marseille, France'
  },
  subject: 'Mise à jour de l\'arbre : nœud matrimonial ajouté',
  body: `Bonjour,

Thomas Petit a effectué une modification dans l'arbre "Famille Petit" :
- Ajout d'un nœud matrimonial entre Pierre Petit et Jeanne Rousseau (mariage, 1952)

Connectez-vous pour voir les dernières modifications.

L'équipe Geneasphere`,
  date: sub(new Date(), {days: 3}).toISOString()
}, {
  id: 6,
  unread: false,
  from: {
    id: 106,
    name: 'Isabelle Dubois',
    email: 'isabelle.dubois@example.com',
    avatar: {src: 'https://i.pravatar.cc/128?u=isabelle'},
    status: 'subscribed',
    location: 'Nantes, France'
  },
  subject: 'Partage de documents : actes d\'état civil',
  body: `Bonjour,

J'ai trouvé plusieurs actes d'état civil qui pourraient compléter votre arbre. Je les ai numérisés et souhaiterais vous les transmettre.

Il s'agit notamment de :
- Acte de naissance de Gaston Moreau (1889)
- Acte de mariage de la famille Leroy (1923)

Pouvez-vous me donner votre adresse email principale pour le partage ?

Bien à vous,
Isabelle`,
  date: sub(new Date(), {days: 7}).toISOString()
}]

export default eventHandler(async () => {
  return mails
})
