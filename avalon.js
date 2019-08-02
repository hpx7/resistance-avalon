const utils = require('./utils')

exports.api = (model) => ({
  createGame: async (playerName) => {
    const gameId = utils.randomId()
    const playerId = utils.randomId()
    return model.createGame(gameId, playerId, playerName).then(result => result || {gameId, playerId})
  },
  joinGame: async (gameId, playerName) => {
    const playerId = utils.randomId()
    return model.joinGame(gameId, playerId, playerName).then(result => result || {playerId})
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
