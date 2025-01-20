import time

from Data.aliyunWriter import AliyunWriter
from config import config
from magic_pdf.data.data_reader_writer import  FileBasedDataWriter, S3DataWriter
from magic_pdf.data.dataset import PymuDocDataset
from magic_pdf.model.doc_analyze_by_custom_model import doc_analyze
from magic_pdf.config.enums import SupportedPdfParseMethod

md_writer = FileBasedDataWriter("./md")
image_writer = AliyunWriter(config.Config["article"]["imagesbucketname"], config.Config["oss"]["accesskeyid"], config.Config["oss"]["accesskeysecret"], " https://{}".format(config.Config["oss"]["endpoint"]))

def PDF2Markdown(pdf_data,user_address):
        ds = PymuDocDataset(pdf_data)
        if ds.classify() == SupportedPdfParseMethod.OCR:
            infer_result = ds.apply(doc_analyze, ocr=True)
            pipe_result = infer_result.pipe_ocr_mode(image_writer)
        else:
            infer_result = ds.apply(doc_analyze, ocr=False)
            pipe_result = infer_result.pipe_txt_mode(image_writer)
        pipe_result.dump_md(md_writer, f'{user_address}_{int(time.time() * 1000)}.md',"")