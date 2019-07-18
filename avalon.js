const server = require('socket.io')
const store = require('./store')
const utils = require('./utils')

const api = (model, socket) => ({
  createGame: (playerName, fn) => {
    const gameId = utils.randomId()
    const playerId = utils.randomId()
    socket.join(playerId)
    model.createGame(gameId, playerId, playerName, fn)
  },
  joinGame: (gameId, playerName, fn) => {
    const playerId = utils.randomId()
    socket.join(playerId)
    model.joinGame(gameId, playerId, playerName, fn)
  },
  rejoinGame: (playerId, fn) => {
    socket.join(playerId)
    model.fetchState(playerId, (state) => {
      if (state) {
        socket.emit('game', state)
      }
      fn({error: state ? null : 'Game not found'})
    })
  },
  leaveGame: (playerId) => {
    socket.leave(playerId)
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
  }
})

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
