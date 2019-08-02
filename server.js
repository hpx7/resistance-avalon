const mongodb = require('mongodb')
const io = require('socket.io')
const avalon = require('./avalon')
const pubsub = require('./pubsub')
const store = require('./store')

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost/db'
const port = process.env.PORT || 3000

mongodb.MongoClient.connect(mongoUri, {useNewUrlParser: true}).then(
  client => {
    const model = store.GameModel(client.db().collection('games'))
    const api = avalon.api(model)
    const broker = pubsub.create(model)
    io(port).on('connection', (socket) => {
      Object.entries(api).forEach(([name, method]) =>
        socket.on(name, (...args) => wrap(method(...args.slice(0, -1)), args.slice(-1)[0])))
      socket.on('subscribe', (playerId, fn) =>
        wrap(broker.subscribe(socket.id, playerId, state => socket.emit('game', state)), fn))
      socket.on('unsubscribe', (playerId) => broker.unsubscribe(socket.id, playerId))
      socket.on('disconnect', () => broker.unsubscribeAll(socket.id))
    })
  },
  console.error
)

const wrap = (promise, fn) =>
  promise.then(fn, () => fn({error: 'Unexpected error occurred'}))
