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
        socket.join(playerId)
        model.createGame(gameId, playerId, playerName, ({success}) => {
          fn({gameId, playerId, success})
        })
      })

      socket.on('joinGame', (gameId, playerName, fn) => {
        console.log(socket.id + ' joinGame ' + gameId + ' ' + playerName)
        const playerId = randomId()
        socket.join(playerId)
        model.joinGame(gameId, playerId, playerName, ({success}) => {
          fn({playerId, success})
        })
      })

      socket.on('rejoinGame', (playerId, fn) => {
        console.log(socket.id + ' rejoinGame '  + playerId)
        socket.join(playerId)
        model.fetchState(playerId, (state) => {
          if (state) {
            socket.emit('game', state)
          }
          fn({success: state ? true : false})
        })
      })

      socket.on('leaveGame', (playerId) => {
        console.log(socket.id + ' leaveGame ' + playerId)
        socket.leave(playerId)
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

      socket.on('disconnect', () => {
        console.log(socket.id + ' disconnect')
      })
    })
  },
  (states) => {
    console.log('received update')
    Object.entries(states).forEach(([playerId, state]) => io.to(playerId).emit('game', state))
  }
)

const randomId = () => {
  return Math.random().toString(36).substring(2, 12)
}
