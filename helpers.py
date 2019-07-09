import random

URL_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~'

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

def random_id():
  return ''.join(random.choices(URL_CHARS, k = 6))

def create_player(player_id, player_name):
  return {'id': player_id, 'name': player_name, 'role': None, 'order': 0}

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

def valid_roles(role_list, player_order):
  return role_list and player_order and len(role_list) == len(player_order) and len(role_list) in quest_configurations and not set(role_list) - role_knowledge.keys()

def get_next_leader(game, quest):
  players = game['players']
  idx = next(i for i in range(len(players)) if players[i]['name'] == quest['leader'])
  return players[(idx + 1) % len(players)]['name']

def roles_for_vote(vote):
  return list(evil_roles if vote == -1 else role_knowledge.keys())

def get_state(game, player):
  return {
    'creator': game['creator'],
    'players': extract('name', sorted(game['players'], key = lambda player: player['order'])),
    'roles': {role: role not in evil_roles for role in extract('role', game['players'])},
    'questConfigurations': quest_configurations.get(len(game['players'])),
    'myName': player['name'],
    'myRole': player['role'],
    'knowledge': get_player_knowledge(game, player),
    'questAttempts': [sanitize_quest(game, quest, player) for quest in game['quests']],
    'status': get_game_status(game)
  }

def get_player_knowledge(game, player):
  known_players = [p for p in game['players'] if p['id'] != player['id'] and p['role'] in role_knowledge.get(player['role'], [])]
  return {
    'players': extract('name', known_players),
    'roles': {role: role not in evil_roles for role in extract('role', known_players)}
  }

def sanitize_quest(game, quest, player):
  q = quest.copy()
  q['votes'] = sorted(quest['votes'], key = lambda vote: vote['player']) if quest['remainingVotes'] == 0 else []
  q['results'] = sorted(extract('vote', quest['results'])) if quest['remainingResults'] == 0 else []
  q['myVote'] = next((vote['vote'] for vote in quest['votes'] if vote['player'] == player['name']), None)
  q['myResult'] = next((result['vote'] for result in quest['results'] if result['player'] == player['name']), None)
  q['status'] = get_quest_status(game, quest)
  del q['voteStatus']
  del q['failures']
  return q

def get_game_status(game):
  if game['quests'] == []:
    return 'not_started'
  if sum(1 for quest in game['quests'] if get_quest_status(game, quest) == 'passed') > 2:
    return 'good_won'
  if sum(1 for quest in game['quests'] if get_quest_status(game, quest) == 'failed') > 2:
    return 'evil_won'
  return 'in_progress'

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

def did_quest_pass(game, quest):
  return quest['failures'] == 0 or (quest['roundNumber'] == 4 and len(game['players']) > 6 and quest['failures'] == 1)

def extract(key, objects):
  return [o[key] for o in objects if o.get(key)]
