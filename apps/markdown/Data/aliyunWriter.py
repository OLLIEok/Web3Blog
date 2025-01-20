import oss2
import mimetypes
import time

from magic_pdf.data.data_reader_writer import DataWriter


class AliyunWriter(DataWriter):
    def __init__(self,bucket_name: str, access_key_id: str, access_key_secret: str, endpoint: str):
        self.auth = oss2.Auth(access_key_id, access_key_secret)
        self.bucket = oss2.Bucket(self.auth, endpoint, bucket_name)

    def write(self, path: str, data: bytes) -> None:
        content_type = mimetypes.guess_type(path)[0] or 'application/octet-stream'
        for i in range(3):
            try:
                self.bucket.put_object(path, data, headers={'Content-Type': content_type})
                break
            except oss2.exceptions.RequestError as e:
                print(f"PDF translate error: {e}")
                time.sleep(1)

    def write_string(self, path: str, data: str) -> None:
        for i in range(3):
            try:
                self.bucket.put_object(path, data.encode('utf-8'), headers={'Content-Type': 'text/plain'})
                break
            except oss2.exceptions.RequestError as e:
                print(f"PDF translate error: {e}")
                time.sleep(1)