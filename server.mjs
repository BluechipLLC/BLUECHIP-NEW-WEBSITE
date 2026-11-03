import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'dist');
http.createServer(async(req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(root,'.'+p);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end();}if(!path.extname(p))file=path.join(root,'index.html');const data=await readFile(file);res.setHeader('Content-Type',({' .html':'text/html','.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(4176,'127.0.0.1',()=>console.log('Local: http://localhost:4176'));
