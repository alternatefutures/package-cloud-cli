
import { Buffer as _globalFleekBuffer } from "node:buffer";
import { AsyncLocalStorage as _globalFleekAsyncLocalStorage } from "node:async_hooks";
import { PerformanceObserver as _globalFleekPerformanceObserver, performance as _globalFleekPerformance } from 'node:perf_hooks';
globalThis.Buffer = _globalFleekBuffer;
globalThis.AsyncLocalStorage = _globalFleekAsyncLocalStorage;
globalThis.performance = _globalFleekPerformance;
globalThis.PerformanceObserver = _globalFleekPerformanceObserver;
globalThis.process = {
  ...globalThis.process,
  env: {
    ...globalThis.process.env,
    AF_URL: "https://hello-cli.af-functions.dev"
    }
};
globalThis.fleek = {
  env: {
    AF_URL: "https://hello-cli.af-functions.dev"
    }
};

var r={async fetch(e){let t=new URL(e.url),n={ok:!0,message:"hello from Alternate Futures function",method:e.method,path:t.pathname,query:Object.fromEntries(t.searchParams.entries()),now:new Date().toISOString()};return new Response(JSON.stringify(n,null,2),{status:200,headers:{"content-type":"application/json; charset=utf-8"}})}};export{r as default};
