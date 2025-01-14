from flask import Flask, request, jsonify
import os
from magic_pdf.data.data_reader_writer import  FileBasedDataWriter, S3DataWriter
from magic_pdf.data.dataset import PymuDocDataset
from magic_pdf.model.doc_analyze_by_custom_model import doc_analyze
from magic_pdf.config.enums import SupportedPdfParseMethod
import jwt
import logging
import time
from threading import Lock
from yaml import safe_load as yaml_load

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

user_task_lock = {}
with open('config/config.yaml', 'r') as f:
    config = yaml_load(f)
app.context = config
md_writer = FileBasedDataWriter("./md")
image_writer = S3DataWriter('pdf', app.context["article"]["imagesbucketname"], app.context["oss"]["accesskeyid"], app.context["oss"]["accesskeysecret"], app.context["oss"]["endpoint"])

@app.route('/pdf2markdown', methods=['POST'])
def pdf2markdown():
    if 'pdf' not in request.files or 'Authorization' not in request.headers:
        return jsonify({'status': False, 'message': 'PDF file or token is missing', 'data': None}), 400
    pdf_file = request.files['pdf']
    token = request.headers['Authorization']
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
        ds = PymuDocDataset(pdf_data)
        if ds.classify() == SupportedPdfParseMethod.OCR:
            infer_result = ds.apply(doc_analyze, ocr=True)
            pipe_result = infer_result.pipe_ocr_mode(image_writer)
        else:
            infer_result = ds.apply(doc_analyze, ocr=False)
            pipe_result = infer_result.pipe_txt_mode(image_writer)
        pipe_result.dump_md(md_writer, f'{user_address}_{int(time.time() * 1000)}.md', "pdf")     
        return jsonify({'status': True, 'message': 'PDF processed successfully', 'data': None}), 200
    except Exception as e:
        logger.error("PDF translate {} error: {}".format(pdf_data,e))
        return jsonify({'status': False, 'message': 'PDF processed failed', 'data': None}), 200
    finally:
        user_task_lock[user_address].release()

if __name__ == "__main__":
    app.run(debug=True)