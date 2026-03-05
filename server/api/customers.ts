const customers = [{
  id: 1,
  name: 'Alex Smith',
  email: 'alex.smith@example.com',
  avatar: { src: 'https://i.pravatar.cc/128?u=1' },
  status: 'subscribed',
  location: 'New York, USA'
}]

export default eventHandler(async () => {
  return customers
})
