import pymongo
import random
import flask
import json
import os

app = flask.Flask(__name__)

# database
games = pymongo.MongoClient(os.getenv('MONGODB_URI')).get_database().games

# which roles have knowledge of which other roles
role_knowledge = {
  'merlin': ['morgana', 'assassin', 'minion'],
  'percival': ['merlin', 'morgana'],
  'loyal servant': [],
  'morgana': ['mordred', 'assassin', 'minion'],
  'mordred': ['morgana', 'assassin', 'minion'],
  'oberon': [],
  'assassin': ['morgana', 'mordred', 'minion'],
  'minion': ['morgana', 'mordred', 'assassin', 'minion']
}

# which characters are evil
evil_roles = {'morgana', 'mordred', 'oberon', 'assassin', 'minion'}

# how many people go on quests per round based on the number of players
quest_configurations = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5]
}

@app.route('/api/create/<player_name>', methods=['POST'])
def create_game(player_name):
  game_id = random_id()
  player_id = random_id()
  games.insert_one({'id': game_id, 'creator': player_name, 'players': [{'id': player_id, 'name': player_name, 'role': None}], 'quests': [] })
  return flask.jsonify({'gameId': game_id, 'playerId': player_id, 'success': True})

@app.route('/api/join/<game_id>/<player_name>', methods=['POST'])
def join_game(game_id, player_name):
  player_id = random_id()
  result = games.update_one(
    {'id': game_id, 'players.name': {'$ne': player_name}, 'quests': [] },
    {'$push': {'players': {'id': player_id, 'name': player_name, 'role': None}}}
  )
  return flask.jsonify({'playerId': player_id, 'success': bool(result.modified_count)})

@app.route('/api/start/<game_id>/<player_id>/<player_name>', methods=['POST'])
def start_game(game_id, player_id, player_name):
  role_list = flask.request.json.get('roleList')
  player_order = flask.request.json.get('playerOrder')
  if role_list is None or player_order is None or len(role_list) != len(player_order) or len(role_list) not in quest_configurations:
    return flask.jsonify({'success': False})

  shuffled_roles = random.sample(role_list, len(role_list))
  result = games.update_one(
    {
      'id': game_id,
      'creator': player_name,
      'players': {'$size': len(player_order), '$elemMatch': {'id': player_id, 'name': player_name}},
      'players.name': {'$all': player_order},
      'quests': [],
    },
    {
      '$set': {'players.$[{}].role'.format(name): role for name, role in zip(player_order, shuffled_roles)},
      '$push': {'quests': create_quest(1, 1, random.choice(player_order), len(player_order))}
    },
    array_filters = [{'{}.name'.format(name): name} for name in player_order]
  )
  return flask.jsonify({'success': bool(result.modified_count)})

@app.route('/api/state/<game_id>/<player_id>')
def get_state(game_id, player_id):
  game = games.find_one({'id': game_id, 'players.id': player_id})
  if game is None:
    return flask.jsonify({'success': False})
  player = next(player for player in game['players'] if player['id'] == player_id)
  response = flask.jsonify({
    'creator': game['creator'],
    'players': extract('name', game['players']),
    'roles': {role: role not in evil_roles for role in extract('role', game['players'])},
    'questConfigurations': quest_configurations.get(len(game['players'])),
    'myName': player['name'],
    'myRole': player['role'],
    'knowledge': get_player_knowledge(game, player),
    'questAttempts': [sanitize_quest(game, quest, player) for quest in game['quests']],
    'status': get_game_status(game)
  })
  response.add_etag()
  return response.make_conditional(flask.request)

@app.route('/api/propose/<quest_id>/<player_id>/<player_name>', methods=['POST'])
def propose_quest(quest_id, player_id, player_name):
  proposed_members = flask.request.json.get('proposal')
  if proposed_members is None:
    return flask.jsonify({'success': False})

  result = games.update_one(
    {
      'players.name': {'$all': proposed_members},
      'players': {'$elemMatch': {'id': player_id, 'name': player_name}},
      'quests': {'$elemMatch': {'id': quest_id, 'members': [], 'leader': player_name, 'size': len(proposed_members)}}
    },
    {'$set': {'quests.$[quest].members': proposed_members}},
    array_filters = [{'quest.id': quest_id}]
  )
  return flask.jsonify({'success': bool(result.modified_count)})

@app.route('/api/proposal/vote/<quest_id>/<player_id>/<player_name>/<vote>', methods=['POST'])
def vote_for_proposal(quest_id, player_id, player_name, vote):
  if vote not in ['1', '-1']:
    return flask.jsonify({'success': False})
  vote = int(vote)
  game = games.find_one_and_update(
    {
      'players': {'$elemMatch': {'id': player_id, 'name': player_name}},
      'quests': {'$elemMatch': {'id': quest_id, 'members': {'$ne': []}, 'votes.player': {'$ne': player_name}}}
    },
    {
      '$push': {'quests.$[quest].votes': {'player': player_name, 'vote': vote}},
      '$inc': {'quests.$[quest].remainingVotes': -1, 'quests.$[quest].voteStatus': vote}
    },
    array_filters = [{'quest.id': quest_id}],
    return_document = pymongo.collection.ReturnDocument.AFTER
  )
  if not game:
    return flask.jsonify({'success': False})

  # move to next leader if proposal was rejected
  quest = next(quest for quest in game['quests'] if quest['id'] == quest_id)
  next_quest = create_quest(quest['roundNumber'], quest['attemptNumber'] + 1, get_next_leader(game, quest), len(game['players']))
  games.update_one(
    {'quests': {'$elemMatch': {'id': quest_id, 'remainingVotes': 0, 'voteStatus': {'$lte': 0}, 'attemptNumber': {'$lt': 5}}}},
    {'$push': {'quests': next_quest}}
  )
  return flask.jsonify({'success': True})

@app.route('/api/quest/vote/<quest_id>/<player_id>/<player_name>/<vote>', methods=['POST'])
def vote_in_quest(quest_id, player_id, player_name, vote):
  if vote not in ['1', '-1']:
    return flask.jsonify({'success': False})
  vote = int(vote)
  game = games.find_one_and_update(
    {
      'players': {'$elemMatch': {'id': player_id, 'name': player_name, 'role': {'$in': list(evil_roles if vote == -1 else role_knowledge.keys())}}},
      'quests': {'$elemMatch': {'id': quest_id, 'members': player_name, 'results.player': {'$ne': player_name}, 'remainingVotes': 0, 'voteStatus': {'$gt': 0}}}
    },
    {
      '$push': {'quests.$[quest].results': {'player': player_name, 'vote': vote}},
      '$inc': {'quests.$[quest].remainingResults': -1, 'quests.$[quest].failures': 1 if vote < 0 else 0}
    },
    array_filters = [{'quest.id': quest_id}],
    return_document = pymongo.collection.ReturnDocument.AFTER
  )
  if not game:
    return flask.jsonify({'success': False})

  # move on to next round if all results have been collected (or do nothing if game is over)
  quest = next(quest for quest in game['quests'] if quest['id'] == quest_id)
  next_quest = create_quest(quest['roundNumber'] + 1, 1, get_next_leader(game, quest), len(game['players']))
  games.update_one(
    {'quests': {'$elemMatch': {'id': quest_id, 'remainingResults': 0, 'roundNumber': {'$lt': 5}}}},
    {'$push': {'quests': next_quest}}
  )
  return flask.jsonify({'success': True})

def random_id():
  return ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~', k = 6))

def extract(key, objects):
  return [o[key] for o in objects if o.get(key)]

def create_quest(roundNumber, attemptNumber, leader, num_players):
  return {
    'id': random_id(),
    'roundNumber': roundNumber,
    'attemptNumber': attemptNumber,
    'size': quest_configurations[num_players][roundNumber - 1],
    'leader': leader,
    'members': [],
    'votes': [],
    'results': [],
    'remainingVotes': num_players,
    'voteStatus': 0,
    'remainingResults': quest_configurations[num_players][roundNumber - 1],
    'failures': 0
  }

def get_player_knowledge(game, player):
  known_players = [p for p in game['players'] if p['id'] != player['id'] and p['role'] in role_knowledge.get(player['role'], [])]
  return {
    'players': extract('name', known_players),
    'roles': {role: role not in evil_roles for role in extract('role', known_players)}
  }

def sanitize_quest(game, quest, player):
  new_quest = quest.copy()
  new_quest['votes'] = sorted(quest['votes'], key = lambda vote: vote['player']) if quest['remainingVotes'] == 0 else []
  new_quest['results'] = [result['vote'] for result in quest['results']] if quest['remainingResults'] == 0 else []
  new_quest['myVote'] = next((vote['vote'] for vote in quest['votes'] if vote['player'] == player['name']), None)
  new_quest['status'] = get_quest_status(game, quest)
  del new_quest['voteStatus']
  del new_quest['failures']
  return new_quest

def get_game_status(game):
  if game['quests'] == []:
    return 'not_started'
  if sum(1 for quest in game['quests'] if get_quest_status(game, quest) == 'passed') > 2:
    return 'good_won'
  if sum(1 for quest in game['quests'] if get_quest_status(game, quest) == 'failed') > 2:
    return 'evil_won'
  return 'in_progress'

def get_next_leader(game, quest):
  players = game['players']
  idx = next(i for i in range(len(players)) if players[i]['name'] == quest['leader'])
  return players[(idx + 1) % len(players)]['name']

def did_quest_pass(game, quest):
  return quest['failures'] == 0 or (quest['roundNumber'] == 4 and len(game['players']) > 6 and quest['failures'] == 1)

def get_quest_status(game, quest):
  if not quest['members']:
    return 'proposing_quest'
  if quest['remainingVotes'] > 0:
    return 'voting_for_proposal'
  if quest['voteStatus'] <= 0:
    return 'proposal_rejected'
  if quest['remainingResults'] > 0:
    return 'voting_in_quest'
  return 'passed' if did_quest_pass(game, quest) else 'failed'
