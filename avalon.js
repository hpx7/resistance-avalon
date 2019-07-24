const server = require('socket.io')
const store = require('./store')
const utils = require('./utils')

const api = (model, socket) => ({
  createGame: (playerName, fn) => {
    const gameId = utils.randomId()
    const playerId = utils.randomId()
    socket.join(gameId + playerId)
    model.createGame(gameId, playerId, playerName, fn)
  },
  joinGame: (gameId, playerName, fn) => {
    const playerId = utils.randomId()
    socket.join(gameId + playerId)
    model.joinGame(gameId, playerId, playerName, fn)
  },
  subscribeToGame: (gameId, playerId, fn) => {
    socket.join(gameId + playerId)
    model.fetchState(gameId, playerId, (state) => {
      if (state) {
        socket.emit('game', state)
      }
      fn({error: state ? null : 'Game not found'})
    })
  },
  unsubscribeFromGame: (gameId, playerId) => {
    socket.leave(gameId + playerId)
  },
  startGame: (gameId, playerId, playerName, roleList, playerOrder, fn) => {
    model.startGame(gameId, playerId, playerName, roleList, playerOrder, fn)
  },
  proposeQuest: (questId, playerId, playerName, proposedMembers, fn) => {
    model.proposeQuest(questId, playerId, playerName, proposedMembers, fn)
  },
  voteForProposal: (questId, playerId, playerName, vote, fn) => {
    model.voteForProposal(questId, playerId, playerName, vote, fn)
  },
  voteInQuest: (questId, playerId, playerName, vote, fn) => {
    model.voteInQuest(questId, playerId, playerName, vote, fn)
  },
  assassinate: (gameId, playerId, playerName, target, fn) => {
    model.assassinate(gameId, playerId, playerName, target, fn)
  }
})

store.init((model) => {
  const io = server(process.env.PORT)

  model.onUpdate((gameId, playerId, state) => io.to(gameId + playerId).emit('game', state))

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
