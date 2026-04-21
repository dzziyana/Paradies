from fastapi import FastAPI
from pydantic import BaseModel
import yake

app = FastAPI()

_extractor = yake.KeywordExtractor(lan="en", n=2, dedupLim=0.9, top=5)


class TextRequest(BaseModel):
    text: str


class KeywordsResponse(BaseModel):
    keywords: str


@app.post("/extract-keywords", response_model=KeywordsResponse)
def extract_keywords(req: TextRequest) -> KeywordsResponse:
    pairs = _extractor.extract_keywords(req.text)
    keywords = ", ".join(kw for kw, _ in pairs)
    return KeywordsResponse(keywords=keywords)
