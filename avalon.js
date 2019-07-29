const utils = require('./utils')

exports.api = (model, socket) => ({
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
  },
  assassinate: (gameId, playerId, playerName, target, fn) => {
    model.assassinate(gameId, playerId, playerName, target, fn)
  }
})
