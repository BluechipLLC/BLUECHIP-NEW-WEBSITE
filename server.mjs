import http from 'node:http';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {createInquiryApi} from './lib/inquiry-api.mjs';
const root=path.resolve(import.meta.dirname,'dist');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4'};
const inquiryApi=createInquiryApi();
const port=Number(process.env.PORT || 4176);
const host=process.env.HOST || '127.0.0.1';
http.createServer(async(req,res)=>{try{
 const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(await inquiryApi(req,res,p))return;
 let file=path.resolve(root,'.'+p);
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end()}
 if(!path.extname(p))file=path.join(root,'index.html');const info=await stat(file);const type=types[path.extname(file).toLowerCase()]||'application/octet-stream';res.setHeader('Content-Type',type);
 if(req.headers.range&&type==='video/mp4'){
  const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end()}
  let start=match[1]?Number(match[1]):Math.max(0,info.size-Number(match[2]));let end=match[1]&&match[2]?Number(match[2]):info.size-1;end=Math.min(end,info.size-1);
  if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end()}
  res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${info.size}`,'Accept-Ranges':'bytes','Content-Length':end-start+1});return createReadStream(file,{start,end}).pipe(res)
 }
 res.setHeader('Content-Length',info.size);if(type==='video/mp4')res.setHeader('Accept-Ranges','bytes');createReadStream(file).pipe(res)
 }catch{if(!res.headersSent)res.writeHead(404);res.end('Not found')}}).listen(port,host,()=>console.log(`Bluechip: http://${host}:${port}`));
