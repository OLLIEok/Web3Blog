from config import config
from flask import Flask, request, jsonify
import jwt
import logging
from model import pdf2markdown,html2markdown
from threading import Lock
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

user_task_lock = {}
app.context = config.Config

@app.route('/pdf2markdown', methods=['POST'])
def pdf2md():
    if 'pdf' not in request.files or 'Authorization' not in request.headers:
        return jsonify({'status': False, 'message': 'PDF file or token is missing', 'data': None}), 400
    pdf_file = request.files['pdf']
    token = str(request.headers['Authorization']).removeprefix("Bearer ")
    try:
        user_address = jwt.decode(token, app.context["secret"], algorithms=['HS256'])['address']
    except jwt.ExpiredSignatureError:
        return jsonify({'status': False, 'message': 'Token has expired', 'data': None}), 401
    except jwt.InvalidTokenError:
        return jsonify({'status': False, 'message': 'Invalid token', 'data': None}), 401
    if not user_address:
        return jsonify({'status': False, 'message': 'User address is missing', 'data': None}), 400
    if user_address in user_task_lock and user_task_lock[user_address].locked():
        return jsonify({'status': False, 'message': 'User has an ongoing task', 'data': None}), 400

    if user_address not in user_task_lock:
        user_task_lock[user_address] = Lock()
    user_task_lock[user_address].acquire()
    pdf_data = pdf_file.read()
    try:
        pdf2markdown.PDF2Markdown(pdf_data,user_address)
        return jsonify({'status': True, 'message': 'PDF processed successfully', 'data': None}), 200
    except Exception as e:  
        logger.error("PDF translate  error: {}".format(e))
        return jsonify({'status': False, 'message': 'PDF processed failed', 'data': None}), 200
    finally:
        user_task_lock[user_address].release()
        
@app.route('/html2markdown', methods=['POST'])
def html2md():
    if 'url' not in request.files or 'Authorization' not in request.headers:
        return jsonify({'status': False, 'message': 'PDF file or token is missing', 'data': None}), 400
    url = request.files['url']
    token = str(request.headers['Authorization']).removeprefix("Bearer ")
    try:
        user_address = jwt.decode(token, app.context["secret"], algorithms=['HS256'])['address']
    except jwt.ExpiredSignatureError:
        return jsonify({'status': False, 'message': 'Token has expired', 'data': None}), 401
    except jwt.InvalidTokenError:
        return jsonify({'status': False, 'message': 'Invalid token', 'data': None}), 401
    if not user_address:
        return jsonify({'status': False, 'message': 'User address is missing', 'data': None}), 400
    if user_address in user_task_lock and user_task_lock[user_address].locked():
        return jsonify({'status': False, 'message': 'User has an ongoing task', 'data': None}), 400

    if user_address not in user_task_lock:
        user_task_lock[user_address] = Lock()
    user_task_lock[user_address].acquire()
    try:
        html2markdown.HTML2Markdown(url)
    finally:
        user_task_lock[user_address].release()    
if __name__ == "__main__":
    app.run(port=5000,debug=True)