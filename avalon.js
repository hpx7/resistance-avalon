const utils = require('./utils')

exports.api = (model, socket) => ({
  createGame: async (playerName) => {
    const gameId = utils.randomId()
    const playerId = utils.randomId()
    socket.join(playerId)
    return model.createGame(gameId, playerId, playerName)
  },
  joinGame: async (gameId, playerName) => {
    const playerId = utils.randomId()
    socket.join(playerId)
    return model.joinGame(gameId, playerId, playerName)
  },
  leaveGame: async (playerId) => {
    socket.leave(playerId)
  },
  startGame: async (gameId, playerId, playerName, roleList, playerOrder) => {
    return model.startGame(gameId, playerId, playerName, roleList, playerOrder)
  },
  proposeQuest: async (questId, playerId, playerName, proposedMembers) => {
    return model.proposeQuest(questId, playerId, playerName, proposedMembers)
  },
  voteForProposal: async (questId, playerId, playerName, vote) => {
    return model.voteForProposal(questId, playerId, playerName, vote)
  },
  voteInQuest: async (questId, playerId, playerName, vote) => {
    return model.voteInQuest(questId, playerId, playerName, vote)
  },
  assassinate: async (gameId, playerId, playerName, target) => {
    return model.assassinate(gameId, playerId, playerName, target)
  }
})
