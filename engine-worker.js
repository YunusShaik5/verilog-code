import {simulate,synthesize} from './engine.js';
self.onmessage=async({data})=>{
  const stage=message=>self.postMessage({type:'stage',message});
  try{const result=await (data.kind==='simulate'?simulate:synthesize)(data,stage);self.postMessage({type:'result',result});}
  catch(error){self.postMessage({type:'error',message:error.message||String(error)});}
};
