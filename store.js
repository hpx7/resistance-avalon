const mongodb = require('mongodb')
const utils = require('./utils')

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

// which roles have knowledge of which other roles
const roleKnowledge = {
  'merlin': ['morgana', 'assassin', 'minion', 'oberon'],
  'percival': ['merlin', 'morgana'],
  'loyal servant': [],
  'morgana': ['mordred', 'assassin', 'minion'],
  'mordred': ['morgana', 'assassin', 'minion'],
  'oberon': [],
  'assassin': ['morgana', 'mordred', 'minion'],
  'minion': ['morgana', 'mordred', 'assassin', 'minion']
}

// which characters are evil
const evilRoles = ['morgana', 'mordred', 'oberon', 'assassin', 'minion']

// how many people go on quests per round based on the number of players
const questConfigurations = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5]
}

const GameModel = (games) => ({
  createGame: (gameId, playerId, playerName, fn) => {
    games.insertOne(
      {
        id: gameId,
        creator: playerName,
        players: [createPlayer(playerId, playerName)],
        playerOrder: [],
        questConfiguration: [],
        currentQuest: null,
        questHistory: [],
        assassinTarget: null
     },
     utils.callback(fn))
  },
  joinGame: (gameId, playerId, playerName, fn) => {
    games.updateOne(
      {id: gameId, 'players.name': {$ne: playerName}, currentQuest: null},
      {$push: {players: createPlayer(playerId, playerName)}},
      utils.callback(fn)
    )
  },
  startGame: (gameId, playerId, playerName, roleList, playerOrder, fn) => {
    const shuffledRoles = utils.shuffle(roleList)
    const players = playerOrder.map((name, i) => ({order: ALPHABET[i], name, role: roleList[i]}))
    const leader = playerOrder[Math.floor(Math.random() * playerOrder.length)]
    const startingQuest = {
      id: utils.randomId(),
      roundNumber: 1,
      attemptNumber: 1,
      size: questConfigurations[players.length][0],
      leader: leader,
      members: [],
      votes: [],
      results: [],
      remainingVotes: players.length,
      voteStatus: 0,
      remainingResults: questConfigurations[players.length][0],
      failures: 0
    }

    games.updateOne(
      {
        id: gameId,
        creator: playerName,
        players: {$size: players.length, $elemMatch: {id: playerId, name: playerName}},
        'players.name': {$all: playerOrder},
        currentQuest: null,
      },
      {
        $set: {
          currentQuest: startingQuest,
          playerOrder: utils.rotate(playerOrder, playerOrder.indexOf(leader)),
          questConfiguration: questConfigurations[players.length],
          ...utils.flatMap(players, ({order, role}) => (
            {[`players.$[${order}].role`]: role, [`players.$[${order}].order`]: order}
          ))
        }
      },
      {arrayFilters: players.map(({order, name}) => ({[`${order}.name`]: name}))},
      utils.callback(fn)
    )
  },
  proposeQuest: (questId, playerId, playerName, proposedMembers, fn) => {
    games.updateOne(
      {
        'players.name': {$all: proposedMembers},
        players: {$elemMatch: {id: playerId, name: playerName}},
        'currentQuest.id': questId,
        'currentQuest.members': [],
        'currentQuest.leader': playerName,
        'currentQuest.size': proposedMembers.length
      },
      {$set: {'currentQuest.members': proposedMembers}},
      utils.callback(fn)
    )
  },
  voteForProposal: (questId, playerId, playerName, vote, fn) => {
    const proposalRejected = {
      $and: [
        {$eq: ['$currentQuest.remainingVotes', 0]},
        {$lte: ['$currentQuest.voteStatus', 0]},
        {$lt: ['$currentQuest.attemptNumber', 5]}
      ]
    }
    const nextQuestAttempt = {
      id: utils.randomId(),
      roundNumber: '$currentQuest.roundNumber',
      attemptNumber: {$add: ['$currentQuest.attemptNumber', 1]},
      size: '$currentQuest.size',
      leader: {$arrayElemAt: ['$playerOrder', {$add: [{$size: '$questHistory'}, 1]}]},
      members: [],
      votes: [],
      results: [],
      remainingVotes: {$size: '$players'},
      voteStatus: 0,
      remainingResults: '$currentQuest.size',
      failures: 0
    }
    games.updateOne(
      {
        players: {$elemMatch: {id: playerId, name: playerName}},
        'currentQuest.id': questId,
        'currentQuest.members': {$ne: []},
        'currentQuest.votes.player': {$ne: playerName}
      },
      [
        {
          $addFields: {
            'currentQuest.votes': {$concatArrays: ['$currentQuest.votes', [{player: playerName, vote: vote}]]},
            'currentQuest.remainingVotes': {$add: ['$currentQuest.remainingVotes', -1]},
            'currentQuest.voteStatus': {$add: ['$currentQuest.voteStatus', vote]}
          }
        },
        {
          $addFields: {
            currentQuest: {$cond: [proposalRejected, nextQuestAttempt, '$currentQuest']},
            questHistory: {$cond: [proposalRejected, {$concatArrays: ['$questHistory', ['$currentQuest']]}, '$questHistory']}
          }
        }
      ],
      utils.callback(fn)
    )
  },
  voteInQuest: (questId, playerId, playerName, vote, fn) => {
    const votingComplete = {
      $and: [
        {$eq: ['$currentQuest.remainingResults', 0]},
        {$lt: ['$currentQuest.roundNumber', 5]}
      ]
    }
    const nextQuestRound = {
      id: utils.randomId(),
      roundNumber: {$add: ['$currentQuest.roundNumber', 1]},
      attemptNumber: 1,
      size: {$arrayElemAt: ['$questConfiguration', '$currentQuest.roundNumber']},
      leader: {$arrayElemAt: ['$playerOrder', {$add: [{$size: '$questHistory'}, 1]}]},
      members: [],
      votes: [],
      results: [],
      remainingVotes: {$size: '$players'},
      voteStatus: 0,
      remainingResults: {$arrayElemAt: ['$questConfiguration', '$currentQuest.roundNumber']},
      failures: 0
    }
    games.updateOne(
      {
        players: {$elemMatch: {id: playerId, name: playerName, role: {$in: rolesForVote(vote)}}},
        'currentQuest.id': questId,
        'currentQuest.members': playerName,
        'currentQuest.results.player': {$ne: playerName},
        'currentQuest.remainingVotes': 0,
        'currentQuest.voteStatus': {$gt: 0}
      },
      [
        {
          $addFields: {
            'currentQuest.results': {$concatArrays: ['$currentQuest.results', [{player: playerName, vote: vote}]]},
            'currentQuest.remainingResults': {$add: ['$currentQuest.remainingResults', -1]},
            'currentQuest.failures': {$add: ['$currentQuest.failures', vote < 0 ? 1 : 0]}
          }
        },
        {
          $addFields: {
            currentQuest: {$cond: [votingComplete, nextQuestRound, '$currentQuest']},
            questHistory: {$cond: [votingComplete, {$concatArrays: ['$questHistory', ['$currentQuest']]}, '$questHistory']}
          }
        }
      ],
      utils.callback(fn)
    )
  },
  assassinate: (gameId, playerId, playerName, target, fn) => {
    games.updateOne(
      {
        id: gameId,
        players: {$elemMatch: {id: playerId, name: playerName, role: 'assassin'}},
        assassinTarget: null
      },
      {$set: {assassinTarget: target}},
      utils.callback(fn)
    )
  },
  fetchState: (playerId, fn) => {
    games.findOne({'players.id': playerId}, (err, game) => {
      if (err) {
        console.error(err)
        fn(null)
      } else {
        const player = game.players.find(player => player.id === playerId)
        fn(getState(game, player))
      }
    })
  },
  onUpdate: (fn) => {
    games.watch({fullDocument: 'updateLookup'}).on('change', data => {
      const game = data.fullDocument
      game.players.forEach(player => fn(player.id, getState(game, player)))
    })
  }
})

const createPlayer = (playerId, playerName) => ({
  id: playerId, name: playerName, role: null, order: 0
})

const rolesForVote = (vote) => vote < 0 ? evilRoles : Object.keys(roleKnowledge)

const getState = (game, player) => {
  const players = utils.sortBy(game.players, 'order')
  return {
    'id': game.id,
    'creator': game.creator,
    'players': players.map(p => p.name),
    'roles': game.currentQuest ? utils.flatMap(players, p => ({[p.role]: !evilRoles.includes(p.role)})) : {},
    'questConfigurations': game.questConfiguration,
    'myId': player.id,
    'myName': player.name,
    'myRole': player.role,
    'knowledge': getPlayerKnowledge(game, player),
    'currentQuest': game.currentQuest ? sanitizeQuest(game, game.currentQuest, player) : null,
    'questHistory': game.questHistory.map(quest => sanitizeQuest(game, quest, player)),
    'status': getGameStatus(game)
  }
}

const getPlayerKnowledge = (game, player) => {
  const knowledge = roleKnowledge[player.role] || []
  const knownPlayers = game.players.filter(p => p.id !== player.id && knowledge.includes(p.role))
  return {
    players: knownPlayers.map(p => p.name),
    roles: utils.flatMap(knownPlayers, p => ({[p.role]: !evilRoles.includes(p.role)}))
  }
}

const sanitizeQuest = (game, quest, player) => {
  const q = Object.assign({}, quest)
  q.votes = quest.remainingVotes === 0 ? utils.sortBy(quest.votes, 'player') : []
  q.results = quest.remainingResults === 0 ? quest.results.map(result => result.vote).sort() : []
  q.myVote =  utils.find(quest.votes, vote => vote.player === player.name).vote
  q.myResult = utils.find(quest.results, result => result.player === player.name).vote
  q.status = getQuestStatus(game, quest)
  delete q.voteStatus
  delete q.failures
  return q
}

const getGameStatus = (game) => {
  if (!game.currentQuest)
    return 'not_started'
  if (game.questHistory.some(quest => quest.attemptNumber > 5))
    return 'evil_won'
  if (game.questHistory.filter(quest => getQuestStatus(game, quest) === 'failed').length > 2)
    return 'evil_won'
  if (game.questHistory.filter(quest => getQuestStatus(game, quest) === 'passed').length <= 2)
    return 'in_progress'
  if (game.players.find(player => player.role === 'assassin') && game.assassinTarget === null)
    return 'assassinating'
  if (game.assassinTarget === utils.find(game.players, player => player.role === 'merlin').name)
    return 'evil_won'
  return 'good_won'
}

const getQuestStatus = (game, quest) => {
  if (quest.members.length === 0)
    return 'proposing_quest'
  if (quest.remainingVotes > 0)
    return 'voting_for_proposal'
  if (quest.voteStatus <= 0)
    return 'proposal_rejected'
  if (quest.remainingResults > 0)
    return 'voting_in_quest'
  return didQuestPass(game, quest) ? 'passed' : 'failed'
}

const didQuestPass = (game, quest) => {
  return quest.failures === 0 || (quest.roundNumber === 4 && game.players.length > 6 && quest.failures === 1)
}

exports.init = (onReady) => {
  mongodb.MongoClient.connect(process.env.MONGODB_URI, {useNewUrlParser: true}, (err, client) => {
    if (err) {
      console.error(err)
    } else {
      onReady(GameModel(client.db().collection('games')))
    }
  })
}
