const mongodb = require('mongodb')

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

// which roles have knowledge of which other roles
const roleKnowledge = {
  'merlin': ['morgana', 'assassin', 'minion'],
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

exports.init = (onReady, onUpdate) => {
  mongodb.MongoClient.connect(process.env.MONGODB_URI).then(client => {
    const games = client.db().collection('games')
    onReady(GameModel(games))
    games.watch({fullDocument: 'updateLookup'}).on('change', data => {
      onUpdate(data.fullDocument)
    })
  })
  .catch(err => {
    console.error(err)
  })
}

const GameModel = (games) => ({
  createGame: (gameId, playerId, playerName, fn) => {
    games.insertOne({id: gameId,
      creator: playerName,
      players: [createPlayer(playerId, playerName)],
      quests: []
    }, callback(fn))
  },
  joinGame: (gameId, playerId, playerName, fn) => {
    games.updateOne(
      {id: gameId, 'players.name': {$ne: playerName}, quests: []},
      {$push: {players: createPlayer(playerId, playerName)}},
      callback(fn)
    )
  },
  startGame: (gameId, playerId, playerName, roleList, playerOrder, fn) => {
    const shuffledRoles = shuffle(roleList)
    const players = playerOrder.map((name, i) => ({order: ALPHABET[i], name, role: roleList[i]}))
    const leader = playerOrder[Math.floor(Math.random() * playerOrder.length)]
    games.updateOne(
      {
        id: gameId,
        creator: playerName,
        players: {$size: players.length, $elemMatch: {id: playerId, name: playerName}},
        'players.name': {$all: playerOrder},
        quests: [],
      },
      {
        $set: flatMap(players, ({order, role}) => (
          {[`players.$[${order}].role`]: role, [`players.$[${order}].order`]: order}
        )),
        $push: {quests: createQuest(1, 1, leader, players.length)}
      },
      {arrayFilters: players.map(({order, name}) => ({[`${order}.name`]: name}))},
      callback(fn)
    )
  },
  proposeQuest: (questId, playerId, playerName, proposedMembers, fn) => {
    games.updateOne(
      {
        'players.name': {$all: proposedMembers},
        players: {$elemMatch: {id: playerId, name: playerName}},
        quests: {$elemMatch: {id: questId, members: [], leader: playerName, size: proposedMembers.length}}
      },
      {$set: {'quests.$[quest].members': proposedMembers}},
      {arrayFilters: [{'quest.id': questId}]},
      callback(fn)
    )
  },
  voteForProposal: (questId, playerId, playerName, vote, fn) => {
    games.findOneAndUpdate(
      {
        players: {$elemMatch: {id: playerId, name: playerName}},
        quests: {$elemMatch: {id: questId, members: {$ne: []}, 'votes.player': {$ne: playerName}}}
      },
      {
        $push: {'quests.$[quest].votes': {player: playerName, vote: vote}},
        $inc: {'quests.$[quest].remainingVotes': -1, 'quests.$[quest].voteStatus': vote}
      },
      {arrayFilters: [{'quest.id': questId}], returnOriginal: false},
      (err, result) => {
        if (err) {
          console.error(err)
          fn(false)
        } else if (result === null || result.value === null) {
          fn(false)
        } else {
          // move to next leader if proposal was rejected
          const game = result.value
          const quest = game.quests.find(({id}) => id === questId)
          if (quest.remainingVotes === 0 && quest.voteStatus < 0 && quest.attemptNumber < 5) {
            games.updateOne(
              {'quests.id': questId},
              {$push: {quests: createQuest(
                quest.roundNumber,
                quest.attemptNumber + 1,
                getNextLeader(game, quest),
                game.players.length
              )}},
            )
          }
          fn(true)
        }
      }
    )
  },
  voteInQuest: (questId, playerId, playerName, vote, fn) => {
    fn(false)
  },
})

const callback = (fn) => (err, result) => {
  if (err) {
    consle.error(err)
    fn(false)
  } else if (result.modifiedCount === 0) {
    fn(false)
  } else {
    fn(true)
  }
}

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const flatMap = (a, mapFn) => {
  const result = {}
  a.forEach(x => {
    Object.entries(mapFn(x)).forEach(([key, val]) => {
      result[key] = val
    })
  })
  return result
}

const randomId = () => Math.random().toString(36).substring(2, 12)

const createPlayer = (playerId, playerName) => ({
  id: playerId, name: playerName, role: null, order: 0
})

const createQuest = (roundNumber, attemptNumber, leader, numPlayers) => ({
  id: randomId(),
  roundNumber: roundNumber,
  attemptNumber: attemptNumber,
  size: questConfigurations[numPlayers][roundNumber - 1],
  leader: leader,
  members: [],
  votes: [],
  results: [],
  remainingVotes: numPlayers,
  voteStatus: 0,
  remainingResults: questConfigurations[numPlayers][roundNumber - 1],
  failures: 0
})

const getNextLeader = (game, quest) => {
  const players = game.players
  const idx = players.findIndex(player => player.name === quest.leader)
  return players[(idx + 1) % players.length].name
}
