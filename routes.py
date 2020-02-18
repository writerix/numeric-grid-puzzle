from flask import Flask, render_template, request, jsonify
import werkzeug
from flask_talisman import Talisman
import re

app = Flask(__name__)

talisman = Talisman(
    app,
    frame_options='DENY',
    content_security_policy={
        'default-src': "'self'",
        'script-src': "'self'",
        'style-src': [
            "'self'",
            "https://maxcdn.bootstrapcdn.com"
        ],
        'frame-src': "'none'",
        'font-src': "https://maxcdn.bootstrapcdn.com",
        'object-src': "'none'"
    })

from flask_sqlalchemy import SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///solutions_db.sqlite'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False #this feature is not needed and adds overhead
db = SQLAlchemy(app)

# Hints are provided for puzzles 3x3 or smaller.
# If a state exceeds this size, an error has occurred.
MAX_STATE_LENGTH = 25

class Puzzle(db.Model):
    state = db.Column(db.Text, primary_key=True)
    steps = db.Column(db.Text)


@app.errorhandler(werkzeug.exceptions.BadRequest)
def invalid_parameters(error):
    response = jsonify({'error': str(error.description)})
    response.status_code = 400
    return response

@app.route('/api/hint', methods=['GET'])
def puzzle_hint():
    puzzle_state = request.args.get('state')
    if puzzle_state is None or len(puzzle_state) == 0:
        raise werkzeug.exceptions.BadRequest('Hint request not properly formatted.')
    if len(puzzle_state) > MAX_STATE_LENGTH:
        raise werkzeug.exceptions.BadRequest('Hint request not properly formatted or the puzzle state is too large.')
    # basic check of state input validity:
    if re.search("^\[\[[0-9,\[\]]*\]\]$", puzzle_state) is None:
        raise werkzeug.exceptions.BadRequest('Hint request not properly formatted.')
    try:
        hint = Puzzle.query.filter_by(state=str(puzzle_state)).first()
    except:
        raise werkzeug.exceptions.BadRequest('Hint request not properly formatted!')
    if hint is None:
        response = jsonify({'error': 'No hint was found.'})
        response.status_code = 404
        return response
    ret_val = hint.steps[1:-1].split(',')[-1]
    ret_val = ret_val.replace("'", "")
    ret_val = ret_val.lstrip()
    return jsonify({'suggestedMove': ret_val})

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True)#optional args