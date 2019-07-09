import mongocache
import pymongo
import random
import os

import helpers

games = pymongo.MongoClient(os.getenv('MONGODB_URI')).get_database().games
games_cache = mongocache.CollectionCache(games, 'id')

def create_game(game_id, player_id, player_name):
  games.insert_one({
    'id': game_id,
    'creator': player_name,
    'players': [helpers.create_player(player_id, player_name)],
    'quests': []
  })
  return True

def join_game(game_id, player_id, player_name):
  result = games.update_one(
    {'id': game_id, 'players.name': {'$ne': player_name}, 'quests': []},
    {'$push': {'players': helpers.create_player(player_id, player_name)}}
  )
  return bool(result.modified_count)

def start_game(game_id, player_id, player_name, role_list, player_order):
  shuffled_roles = random.sample(role_list, len(role_list))
  players = [(helpers.URL_CHARS[i], name, shuffled_roles[i]) for i, name in enumerate(player_order)]
  _, leader, _ = random.choice(players)
  result = games.update_one(
    {
      'id': game_id,
      'creator': player_name,
      'players': {'$size': len(players), '$elemMatch': {'id': player_id, 'name': player_name}},
      'players.name': {'$all': [name for _, name, _ in players]},
      'quests': [],
    },
    {
      '$set': flatten_dicts([
        {'players.$[{}].role'.format(i): role, 'players.$[{}].order'.format(i): i} for i, _, role in players
      ]),
      '$push': {'quests': helpers.create_quest(1, 1, leader, len(players))}
    },
    array_filters = [{'{}.name'.format(i): name} for i, name, _ in players]
  )
  return bool(result.modified_count)

def propose_quest(quest_id, player_id, player_name, proposed_members):
  result = games.update_one(
    {
      'players.name': {'$all': proposed_members},
      'players': {'$elemMatch': {'id': player_id, 'name': player_name}},
      'quests': {'$elemMatch': {'id': quest_id, 'members': [], 'leader': player_name, 'size': len(proposed_members)}}
    },
    {'$set': {'quests.$[quest].members': proposed_members}},
    array_filters = [{'quest.id': quest_id}]
  )
  return bool(result.modified_count)

def vote_for_proposal(quest_id, player_id, player_name, vote):
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
    return False

  # move to next leader if proposal was rejected
  quest = next(quest for quest in game['quests'] if quest['id'] == quest_id)
  next_quest = helpers.create_quest(
    quest['roundNumber'],
    quest['attemptNumber'] + 1,
    helpers.get_next_leader(game, quest),
    len(game['players'])
  )
  games.update_one(
    {'quests': {'$elemMatch': {'id': quest_id, 'remainingVotes': 0, 'voteStatus': {'$lte': 0}, 'attemptNumber': {'$lt': 5}}}},
    {'$push': {'quests': next_quest}}
  )
  return True

def vote_in_quest(quest_id, player_id, player_name, vote):
  game = games.find_one_and_update(
    {
      'players': {'$elemMatch': {'id': player_id, 'name': player_name, 'role': {'$in': helpers.roles_for_vote(vote)}}},
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
    return False

  # move on to next round if all results have been collected (or do nothing if game is over)
  quest = next(quest for quest in game['quests'] if quest['id'] == quest_id)
  next_quest = helpers.create_quest(
    quest['roundNumber'] + 1,
    1,
    helpers.get_next_leader(game, quest),
    len(game['players'])
  )
  games.update_one(
    {'quests': {'$elemMatch': {'id': quest_id, 'remainingResults': 0, 'roundNumber': {'$lt': 5}}}},
    {'$push': {'quests': next_quest}}
  )
  return True

def get_state(game_id, player_id):
  game = games_cache.get_doc(game_id)
  if game is None or not any(player['id'] == player_id for player in game['players']):
    return False
  player = next(player for player in game['players'] if player['id'] == player_id)
  return helpers.get_state(game, player)

def flatten_dicts(dicts):
  return {k: v for d in dicts for k, v in d.items()}
