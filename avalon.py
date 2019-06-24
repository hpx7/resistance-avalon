import random
import flask
import json
import copy
import os

app = flask.Flask(__name__)

# in-memory database
games = {}

# which roles have knowledge of which other roles
role_knowledge = {
  'merlin': ['morgana', 'assasin', 'minion'],
  'percival': ['merlin', 'morgana'],
  'loyal servent': [],
  'morgana': ['mordred', 'assasin', 'minion'],
  'mordred': ['morgana', 'assasin', 'minion'],
  'oberon': [],
  'assasin': ['morgana', 'mordred', 'minion'],
  'minion': ['morgana', 'mordred', 'assasin', 'minion']
}

evil_characters = {'morgana', 'mordred', 'oberon', 'assasin', 'minion'}

# how many people go on quests per quest based on the number of players
quest_configurations = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5]
}

@app.route('/api/list')
def list_games():
  return flask.jsonify({'games': games.keys()})

@app.route('/api/create', methods=['POST'])
def create_game():
  game_id = str(len(games))
  games[game_id] = {'playerNames': {}, 'roles': {}, 'playerOrder': [], 'quests': []}
  return flask.jsonify({'gameId': game_id})

@app.route('/api/join/<game_id>/<player_name>', methods=['POST'])
def join_game(game_id, player_name):
  game = games.get(game_id)
  if game is None or is_game_started(game):
    return flask.jsonify({'error': True})

  # verify no duplicate name
  if player_name in game['playerNames'].values():
    return flask.jsonify({'error': True})

  # generate random player id and associate it with their name
  player_id = str(int(random.random() * 1000000))
  game['playerNames'][player_id] = player_name

  return flask.jsonify({'userId': player_id})

@app.route('/api/start/<game_id>', methods=['POST'])
def start_game(game_id):
  game = games.get(game_id)
  role_list = flask.request.json.get('roleList')
  player_order = flask.request.json['playerOrder']
  if game is None or role_list is None or player_order is None or is_game_started(game):
    return flask.jsonify({'error': True})

  # verify number of roles
  if len(role_list) != len(game['playerNames']) or len(role_list) not in quest_configurations:
    return flask.jsonify({'error': True})

  # randomly assign roles and choose a starting mission leader
  game['roles'] = dict(zip(game['playerNames'].keys(), random.sample(role_list, len(role_list))))
  game['playerOrder'] = player_order
  game['quests'].append({
    'questNumber': 1,
    'attemptNumber': 1,
    'leader': random.choice(list(game['playerNames'].values())),
    'members': [],
    'votes': {},
    'results': {}
  })

  return flask.jsonify({'leader': game['quests'][0]['leader']})

@app.route('/api/state/<game_id>/<player_id>')
def get_state(game_id, player_id):
  game = games.get(game_id)
  player_name = game['playerNames'].get(player_id)
  if game is None or player_name is None:
    return flask.jsonify({'error': True})

  return flask.jsonify({
    'players': game['playerOrder'] or list(game['playerNames'].values()),
    'roleList': list(game['roles'].values()),
    'questConfigurations': quest_configurations.get(num_players(game)),
    'myName': player_name,
    'myRole': get_role(game, player_id),
    'playerHints': get_player_hints(game, player_id),
    'quests': sanitize_quests(game)
  })

@app.route('/api/propose/<game_id>/<player_id>', methods=['POST'])
def propose_quest(game_id, player_id):
  game = games.get(game_id)
  player_name = game['playerNames'].get(player_id)
  proposed_members = flask.request.json.get('proposal')
  if game is None or player_name is None or proposed_members is None or not is_game_started(game):
    return flask.jsonify({'error': True})

  current_quest = game['quests'][-1]

  # verify we are the quest leader, voting for the quest hasn't begun, and the correct number of players are proposed
  if not (current_quest['leader'] == player_name and len(current_quest['votes']) == 0 and len(proposed_members) == quest_size(game, current_quest)):
    return flask.jsonify({'error': True})

  current_quest['members'] = proposed_members

  return flask.jsonify({})

@app.route('/api/proposal/vote/<game_id>/<player_id>/<vote>', methods=['POST'])
def vote_for_proposal(game_id, player_id, vote):
  game = games.get(game_id)
  player_name = game['playerNames'].get(player_id)
  if game is None or player_name is None or not is_game_started(game):
    return flask.jsonify({'error': True})

  current_quest = game['quests'][-1]
  vote = bool(int(vote))

  # verify quest proposal has been made and quest voting isn't complete
  if not(len(current_quest['members']) > 0 and len(current_quest['votes']) < num_players(game)):
    return flask.jsonify({'error': True})

  current_quest['votes'][player_name] = vote

  # move to next leader if proposal was rejected
  if is_proposal_voting_complete(game, current_quest) and not proposal_accepted(game, current_quest):
    # TODO check if 5 consecutive fails
    game['quests'].append({
      'questNumber': current_quest['questNumber'],
      'attemptNumber': current_quest['attemptNumber'] + 1,
      'leader': get_next_leader(game),
      'members': current_quest['members'],
      'votes': {},
      'results': {}
    })

  return flask.jsonify({})

@app.route('/api/quest/vote/<game_id>/<player_id>/<vote>', methods=['POST'])
def vote_in_quest(game_id, player_id, vote):
  game = games.get(game_id)
  player_name = game['playerNames'].get(player_id)
  if game is None or player_name is None or not is_game_started(game) or is_game_over(game):
    return flask.jsonify({'error': True})

  current_quest = game['quests'][-1]
  vote = bool(int(vote))

  # verify voting for the quest is complete and we are in the quest and our vote is valid
  if not(is_proposal_voting_complete(game, current_quest) and player_name in current_quest['members'] and is_valid_quest_vote(game, player_id, vote)):
    return flask.jsonify({'error': True})

  current_quest['results'][player_name] = vote

  # move on to next round if all results have been collected (or do nothing if game is over)
  if is_quest_voting_complete(game, current_quest) and not is_game_over(game):
    game['quests'].append({
      'questNumber': current_quest['questNumber'] + 1,
      'attemptNumber': 1,
      'leader': get_next_leader(game),
      'members': [],
      'votes': {},
      'results': {}
    })

  return flask.jsonify({})

def is_game_started(game):
  return len(game['roles']) > 0

def num_players(game):
  return len(game['playerNames'])

def get_role(game, player_id):
  return game['roles'].get(player_id)

def get_player_hints(game, player_id):
  player_hints = []
  for other_player_id, other_role in game['roles'].items():
    if other_player_id != player_id and other_role in role_knowledge[get_role(game, player_id)]:
      player_hints.append(game['playerNames'][other_player_id])
  return player_hints

def sanitize_quests(game):
  quests = copy.deepcopy(game['quests'])
  # mask in-progress voting
  for quest in quests:
    quest['votes'] = quest['votes'] if is_proposal_voting_complete(game, quest) else {}
    quest['results'] = list(quest['results'].values()) if is_quest_voting_complete(game, quest) else []
  return quests

def quest_size(game, quest):
  quest_number = quest['questNumber'] - 1 # convert 1-indexed quest number to 0-indexed array index
  return quest_configurations[num_players(game)][quest_number]

def proposal_accepted(game, quest):
  return sum(quest['votes'].values()) * 2 > num_players(game)

def is_proposal_voting_complete(game, quest):
  return len(quest['votes']) == num_players(game)

def is_valid_quest_vote(game, player_id, vote):
  return vote or get_role(game, player_id) in evil_characters

def is_quest_voting_complete(game, quest):
  return len(quest['results']) == quest_size(game, quest)

def is_game_over(game):
  completed_quests = [quest for quest in game['quests'] if is_quest_voting_complete(game, quest)]
  num_successes = sum(did_quest_succeed(game, quest) for quest in completed_quests)
  num_failures = len(completed_quests) - num_successes
  return num_successes > 2 or num_failures > 2

def did_quest_succeed(game, quest):
  num_fails = len(quest['results']) - sum(quest['results'].values())
  return num_fails == 0 or quest['questNumber'] == 4 and num_players(game) > 6 and num_fails == 1

def get_next_leader(game):
  current_quest = game['quests'][-1]
  idx = game['playerOrder'].index(current_quest['leader'])
  return game['playerOrder'][(idx + 1) % len(game['playerOrder'])]
