#!/usr/bin/env python3
"""Destiny Generation Bridge v0.1 — zero-cost local semantic scene interpretation.
Runs entirely on the GM PC and talks only to a local Ollama server.
"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
import json, os

HOST="127.0.0.1"; PORT=int(os.getenv("DESTINY_BRIDGE_PORT","8765"))
OLLAMA=os.getenv("DESTINY_OLLAMA_URL","http://127.0.0.1:11434")
MODEL=os.getenv("DESTINY_OLLAMA_MODEL","qwen3:4b")
FIELDS=["environment","geometry","entrancesExits","coverObstacles","scenery","lightingMood","tacticalFeatures","visualPrompt"]

def ollama(path, payload=None, timeout=120):
    data=None if payload is None else json.dumps(payload).encode()
    req=Request(OLLAMA+path,data=data,headers={"Content-Type":"application/json"},method="POST" if data else "GET")
    with urlopen(req,timeout=timeout) as r:return json.loads(r.read())

def health():
    try:
        tags=ollama("/api/tags",timeout=3); models=[m.get("name","") for m in tags.get("models",[])]
        return {"ok":True,"runtime":"ollama","model":MODEL,"modelInstalled":MODEL in models,"models":models,"zeroCost":True}
    except Exception as e:return {"ok":False,"runtime":"ollama","model":MODEL,"zeroCost":True,"error":str(e)}

def interpret(name, source):
    prompt=f"""You are the local scene interpreter for a Star Wars Saga Edition virtual tabletop.
Turn SOURCE into concise PLAYABLE TOP-DOWN MAP DESIGN, not prose summary.
Use only source-supported facts plus conservative spatial inference required for play. Never invent named rooms, doors, hazards, props, NPCs, architecture, or lore. If the scene reuses an existing venue, say so. Do not copy read-aloud wording.
Return JSON only with these exact string keys: {", ".join(FIELDS)}.
visualPrompt must be a cohesive top-down VTT backdrop instruction, gridless, no text labels.
SCENE: {name}
SOURCE:
{source[:12000]}"""
    out=ollama("/api/generate",{"model":MODEL,"prompt":prompt,"stream":False,"format":"json","options":{"temperature":0.15}},180)
    obj=json.loads(out.get("response","{}"))
    return {k:str(obj.get(k,"")).strip() for k in FIELDS}

class H(BaseHTTPRequestHandler):
    def headers(self,code=200):
        self.send_response(code);self.send_header("Content-Type","application/json");self.send_header("Access-Control-Allow-Origin","https://kotor2-destiny.github.io");self.send_header("Access-Control-Allow-Headers","Content-Type");self.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS");self.end_headers()
    def sendj(self,obj,code=200):self.headers(code);self.wfile.write(json.dumps(obj).encode())
    def do_OPTIONS(self):self.headers(204)
    def do_GET(self):
        if self.path=="/health":self.sendj(health())
        else:self.sendj({"error":"not found"},404)
    def do_POST(self):
        if self.path!="/interpret-scene":return self.sendj({"error":"not found"},404)
        try:
            n=int(self.headers.get("Content-Length","0"));body=json.loads(self.rfile.read(n) or b"{}");name=str(body.get("sceneName","")).strip();source=str(body.get("sourceContext","")).strip()
            if not name or not source:return self.sendj({"error":"sceneName and sourceContext required"},400)
            h=health()
            if not h["ok"]:return self.sendj({"error":"Local Ollama is not running.","details":h},503)
            if not h["modelInstalled"]:return self.sendj({"error":f"Local model {MODEL} is not installed.","details":h},503)
            self.sendj({"brief":interpret(name,source),"runtime":"local","model":MODEL,"zeroCost":True})
        except (HTTPError,URLError,TimeoutError) as e:self.sendj({"error":"Local model request failed.","details":str(e)},503)
        except Exception as e:self.sendj({"error":str(e)},400)
    def log_message(self,fmt,*args):print("[Destiny Bridge] "+fmt%args)

if __name__=="__main__":
    print(f"Destiny Generation Bridge: http://{HOST}:{PORT}")
    print(f"Local model runtime: {OLLAMA} | model: {MODEL}")
    ThreadingHTTPServer((HOST,PORT),H).serve_forever()
