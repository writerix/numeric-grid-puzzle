import unittest

from routes import app, talisman, MAX_STATE_LENGTH

HINT = 'api/hint?state='

class TestRoutes(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        talisman.force_https = False
    
    def test_index(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
    
    def test_page_does_not_exist(self):
        response = self.app.get('/DNE_9826b74a_04b4_4940_86ae_d404ab343373')
        self.assertEqual(response.status_code, 404, 'A request for a page that doesn\'t exist should return code 404.')
    
    def test_puzzle_hint_state_too_large(self):
        response = self.app.get(HINT + '[[' + '0' * MAX_STATE_LENGTH + ']]')
        self.assertEqual(response.status_code, 400, 'State beyond the maximum size for puzzle hints.')
        self.assertEqual(response.data, b'{"error":"Hint request not properly formatted or the puzzle state is too large."}\n')
    
    def test_puzzle_hint_invalid_state(self):
        response = self.app.get(HINT)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, b'{"error":"Hint request not properly formatted."}\n')
        
        response = self.app.get(HINT + '[]')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, b'{"error":"Hint request not properly formatted."}\n')
        
        response = self.app.get(HINT + '[[1,invalid_characters]]')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, b'{"error":"Hint request not properly formatted."}\n')
    
    def test_puzzle_hint_no_hint(self):
        response = self.app.get(HINT + '[[2,1]]')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data, b'{"error":"No hint was found."}\n')
    
    def test_puzzle_hint_success(self):
        response = self.app.get(HINT + '[[1,2],[3,4]]')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, b'{"suggestedMove":"Solved puzzle."}\n')
        
        response = self.app.get(HINT + '[[1,2,3],[4,5,6],[7,8,9]]')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, b'{"suggestedMove":"Solved puzzle."}\n')
        
        response = self.app.get(HINT + '[[1,2,3],[4,5,6],[9,7,8]]')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, b'{"suggestedMove":"Row 3 left."}\n')
        
        response = self.app.get(HINT + '[[4,2,3],[7,5,6],[1,8,9]]')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, b'{"suggestedMove":"Column 1 down."}\n')

if __name__ == '__main__':
    unittest.main()