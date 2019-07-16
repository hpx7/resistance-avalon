const server = require('socket.io')
const crypto = require('crypto')
const store = require('./store')

const api = (model, socket) => ({
  createGame: (playerName, fn) => {
    const gameId = randomId()
    const playerSecret = randomId()
    const playerId = hash(playerSecret)
    socket.join(playerId)
    model.createGame(gameId, playerId, playerName, ({success}) => {
      fn({gameId, playerSecret, success})
    })
  },
  joinGame: (gameId, playerName, fn) => {
    const playerSecret = randomId()
    const playerId = hash(playerSecret)
    socket.join(playerId)
    model.joinGame(gameId, playerId, playerName, ({success}) => {
      fn({playerSecret, success})
    })
  },
  rejoinGame: (playerSecret, fn) => {
    const playerId = hash(playerSecret)
    socket.join(playerId)
    model.fetchState(playerId, (state) => {
      if (state) {
        socket.emit('game', state)
      }
      fn({success: state ? true : false})
    })
  },
  leaveGame: (playerSecret) => {
    const playerId = hash(playerSecret)
    socket.leave(playerId)
  },
  startGame: (gameId, playerSecret, playerName, roleList, playerOrder, fn) => {
    const playerId = hash(playerSecret)
    model.startGame(gameId, playerId, playerName, roleList, playerOrder, fn)
  },
  proposeQuest: (questId, playerSecret, playerName, proposedMembers, fn) => {
    const playerId = hash(playerSecret)
    model.proposeQuest(questId, playerId, playerName, proposedMembers, fn)
  },
  voteForProposal: (questId, playerSecret, playerName, vote, fn) => {
    const playerId = hash(playerSecret)
    model.voteForProposal(questId, playerId, playerName, vote, fn)
  },
  voteInQuest: (questId, playerSecret, playerName, vote, fn) => {
    const playerId = hash(playerSecret)
    model.voteInQuest(questId, playerId, playerName, vote, fn)
  }
})

const randomId = () => Math.random().toString(36).substring(2)

const hash = (str) => crypto.createHash('sha256').update(str).digest('base64')

store.init((model) => {
  const io = server(process.env.PORT)

  model.onUpdate((playerId, state) => io.to(playerId).emit('game', state))

  io.on('connection', (socket) => {
    console.log(socket.id + ' connection')

    Object.entries(api(model, socket)).forEach(([name, method]) => {
      socket.on(name, method)
    })

    socket.on('disconnect', () => {
      console.log(socket.id + ' disconnect')
    })
  })
})
