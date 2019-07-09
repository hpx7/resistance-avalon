import flask

import helpers
import store

app = flask.Flask(__name__)

@app.route('/api/create/<player_name>', methods=['POST'])
def create_game(player_name):
  game_id = helpers.random_id()
  player_id = helpers.random_id()
  success = store.create_game(game_id, player_id, player_name)
  return flask.jsonify({'gameId': game_id, 'playerId': player_id, 'success': success})

@app.route('/api/join/<game_id>/<player_name>', methods=['POST'])
def join_game(game_id, player_name):
  player_id = helpers.random_id()
  success = store.join_game(game_id, player_id, player_name)
  return flask.jsonify({'playerId': player_id, 'success': success})

@app.route('/api/start/<game_id>/<player_id>/<player_name>', methods=['POST'])
def start_game(game_id, player_id, player_name):
  role_list = flask.request.json.get('roleList')
  player_order = flask.request.json.get('playerOrder')
  if not helpers.valid_roles(role_list, player_order):
    return flask.jsonify({'success': False})

  success = store.start_game(game_id, player_id, player_name, role_list, player_order)
  return flask.jsonify({'success': success})

@app.route('/api/propose/<quest_id>/<player_id>/<player_name>', methods=['POST'])
def propose_quest(quest_id, player_id, player_name):
  proposed_members = flask.request.json.get('proposal')
  if proposed_members is None:
    return flask.jsonify({'success': False})

  success = store.propose_quest(quest_id, player_id, player_name, proposed_members)
  return flask.jsonify({'success': success})

@app.route('/api/proposal/vote/<quest_id>/<player_id>/<player_name>/<vote>', methods=['POST'])
def vote_for_proposal(quest_id, player_id, player_name, vote):
  if vote not in ['1', '-1']:
    return flask.jsonify({'success': False})

  vote = int(vote)
  success = store.vote_for_proposal(quest_id, player_id, player_name, vote)
  return flask.jsonify({'success': success})

@app.route('/api/quest/vote/<quest_id>/<player_id>/<player_name>/<vote>', methods=['POST'])
def vote_in_quest(quest_id, player_id, player_name, vote):
  if vote not in ['1', '-1']:
    return flask.jsonify({'success': False})

  vote = int(vote)
  success = store.vote_in_quest(quest_id, player_id, player_name, vote)
  return flask.jsonify({'success': success})

@app.route('/api/state/<game_id>/<player_id>')
def get_state(game_id, player_id):
  game = store.get_state(game_id, player_id)
  if not game:
    return flask.jsonify({'success': False})
  response = flask.jsonify(game)
  response.add_etag()
  return response.make_conditional(flask.request)
