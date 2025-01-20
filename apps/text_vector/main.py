# This is a sample Python script.

# Press Shift+F10 to execute it or replace it with your code.
# Press Double Shift to search everywhere for classes, files, tool windows, actions, and settings.

from concurrent import futures
import logging

import grpc
from sentence_transformers import SentenceTransformer

import vector_pb2
import vector_pb2_grpc

model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

def get_embedding(text:str)->str:
    embedding = model.encode(text)
    # 将嵌入转换为字符串
    embedding_str = ','.join(map(str, embedding))
    return embedding_str

class Vector(vector_pb2_grpc.TextVectorServicer):
    def convertVector(self, request, context):
        return vector_pb2.convertResponse(vector=convert_string_to_floats(get_embedding(request.text)))
def convert_string_to_floats(s):
    return list(map(float, s.strip('[]').split(',')))

def serve():
    port = "9090"
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    vector_pb2_grpc.add_TextVectorServicer_to_server(Vector(), server)
    server.add_insecure_port("[::]:" + port)
    server.start()
    print("Server started, listening on " + port)
    server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig()
    serve()