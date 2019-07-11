const server = require('socket.io')
const store = require('./store')

const io = server(3000)

store.init(
  (model) => {
    io.on('connection', (socket) => {
      console.log(socket.id + ' connection')

      socket.on('createGame', (playerName, fn) => {
        console.log(socket.id + ' createGame ' + playerName)
        const gameId = randomId()
        const playerId = randomId()
        model.createGame(gameId, playerId, playerName, (success) => {
          if (success) {
            socket.join(gameId)
          }
          fn(gameId, playerId, success)
        })
      })

      socket.on('joinGame', (gameId, playerName, fn) => {
        console.log(socket.id + ' joinGame ' + gameId + ' ' + playerName)
        const playerId = randomId()
        model.joinGame(gameId, playerId, playerName, (success) => {
          if (success) {
            socket.join(gameId)
          }
          fn(playerId, success)
        })
      })

      socket.on('startGame', (gameId, playerId, playerName, roleList, playerOrder, fn) => {
        console.log(socket.id + ' joinGame ' + gameId + ' ' + playerId + ' ' + playerName + ' ' + roleList + ' ' + playerOrder)
        model.startGame(gameId, playerId, playerName, roleList, playerOrder, fn)
      })

      socket.on('proposeQuest', (questId, playerId, playerName, proposedMembers, fn) => {
        console.log(socket.id + ' proposeQuest ' + questId + ' ' + playerId + ' ' + playerName + ' ' + proposedMembers)
        model.proposeQuest(questId, playerId, playerName, proposedMembers, fn)
      })

      socket.on('voteForProposal', (questId, playerId, playerName, vote, fn) => {
        console.log(socket.id + ' voteForProposal ' + questId + ' ' + playerId + ' ' + playerName + ' ' + vote)
        model.voteForProposal(questId, playerId, playerName, vote, fn)
      })

      socket.on('voteInQuest', (questId, playerId, playerName, vote, fn) => {
        console.log(socket.id + ' voteInQuest ' + questId + ' ' + playerId + ' ' + playerName + ' ' + vote)
        model.voteInQuest(questId, playerId, playerName, vote, fn)
      })

      socket.on('leaveGame', (gameId, fn) => {
        console.log(socket.id + ' leaveGame ' + gameId)
        socket.leave(gameId)
        fn()
      })

      socket.on('disconnect', () => {
        console.log(socket.id + ' disconnect')
      })
    })
  },
  (game) => {
    console.log('update ' + game.id)
    io.to(game.id).emit('game', game)
  }
)

const randomId = () => {
  return Math.random().toString(36).substring(2, 12)
}
