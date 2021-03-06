const mongodb = require('mongodb')
const server = require('socket.io')
const avalon = require('./avalon')
const store = require('./store')

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost/db'
const port = process.env.PORT || 3000

mongodb.MongoClient.connect(mongoUri, {useNewUrlParser: true}).then(
  client => {
    const io = server(port)

    const model = store.GameModel(client.db().collection('games'))
    model.onUpdate((playerId, state) => io.to(playerId).emit('game', state))

    io.on('connection', (socket) => {
      Object.entries(avalon.api(model, socket)).forEach(([name, method]) => {
        socket.on(name, (...args) => {
          const fn = args.slice(-1)[0]
          method(...args.slice(0, -1))
            .then(result => fn({error: null}), error => fn({error}))
          })
      })
      socket.on('rejoinGame', playerId => {
        socket.join(playerId)
        model.fetchState(playerId).then(state => socket.emit('game', state))
      })
    })
  },
  err => console.error(err)
)
