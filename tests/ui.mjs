// Run with happy-dom installed, or set SIGNAL_DOM_TEST_MODULE to its entry file.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {Window}=await import(process.env.SIGNAL_DOM_TEST_MODULE || 'happy-dom');
import * as core from '../core.js';
import {examples} from '../examples.js';
import {labPrograms,labTitles,labCollectionText} from '../lab-programs.js';
import {simulate,synthesize} from '../engine.js';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const window=new Window({url:'https://signal.test/',settings:{disableJavaScriptFileLoading:true,disableJavaScriptEvaluation:true,disableCSSFileLoading:true}});
const doc=window.document;doc.write(read('index.html'));
window.happyDOM.settings.disableJavaScriptEvaluation=false;
Object.assign(window,{examples,labPrograms,labTitles,labCollectionText,...core,esc:core.escapeHTML,structuredClone,ResizeObserver:class{observe(){}disconnect(){}}});
const downloads=[];
window.URL.createObjectURL=blob=>{downloads.push(blob);return 'blob:https://signal.test/download';};
window.URL.revokeObjectURL=()=>{};
window.Worker=class{
 constructor(){this.active=true;}
 postMessage(data){(data.kind==='simulate'?simulate:synthesize)(data).then(result=>{if(this.active)this.onmessage?.({data:{type:'result',result}});}).catch(e=>{if(this.active)this.onmessage?.({data:{type:'error',message:e.message}});});}
 terminate(){this.active=false;}
};
window.eval(read('vendor/elk.bundled.js'));window.eval(read('vendor/netlistsvg.bundle.js'));
const js=read('app.js').replace(/^import .*;\n/gm,'').replace(/import\.meta\.url/g,JSON.stringify('https://signal.test/app.js'));
window.eval(js+'\nwindow.__qa={state,run,setCursor,loadExample,renderLabs};');
const qa=window.__qa,$=s=>doc.querySelector(s),$$=s=>[...doc.querySelectorAll(s)];
async function idle(){for(let i=0;i<1200;i++){if(!qa.state.busy)return;await new Promise(r=>setTimeout(r,50));}throw new Error('UI timeout');}
await idle();assert(qa.state.data);assert($('#diagram-content svg'));
$('#labs-button').click();assert($('#labs-dialog').open);assert.equal($$('.lab-card').length,71);
assert.equal($('#lab-filter').options.length,11);
$('#lab-filter').value='6';$('#lab-filter').dispatchEvent(new window.Event('change'));assert.equal($$('.lab-card').length,7);
$('#lab-category').value='Lab exercise';$('#lab-category').dispatchEvent(new window.Event('change'));assert.equal($$('.lab-card').length,4);
$('#lab-search').value='active-low';$('#lab-search').dispatchEvent(new window.Event('input'));assert.equal($$('.lab-card').length,2);
$('#lab-search').value='no-such-topic';$('#lab-search').dispatchEvent(new window.Event('input'));assert.equal($$('.lab-card').length,0);assert($('.lab-empty'));
$('#lab-search').value='';$('#lab-filter').value='5';$('#lab-category').value='';qa.renderLabs();
$('#lab-download-all').click();assert.equal(downloads.length,1);assert.equal((await downloads[0].text()).trimEnd(),labCollectionText().trimEnd());
$('[data-download-lab="lab5-q1"]').click();assert.equal(downloads.length,2);assert((await downloads[1].text()).includes('lab5_q1_circuit'));
$('[data-load-lab="lab5-q1"]').click();await idle();assert(!$('#labs-dialog').open);assert.equal(qa.state.example,'lab5-q1');
assert.equal($('#project-tag').textContent,'LAB SHEET');assert(qa.state.data);assert($('#diagram-content svg'));assert($('#console-output').textContent.includes('PASS: lab5-q1'));
$('#testbench-tab').click();assert($('#code-editor').value.includes('$fatal'));$('#design-tab').click();
$('#play-button').click();assert(qa.state.playing);$('#play-button').click();assert(!qa.state.playing);
$('#code-editor').value+='\n// my study note';$('#code-editor').dispatchEvent(new window.Event('input'));
$('#labs-button').click();$('[data-load-lab="lab5-q2"]').click();assert($('#confirm-dialog').open);$('#confirm-cancel').click();assert(qa.state.design.includes('my study note'));
$('#labs-button').click();$('[data-load-lab="lab5-q2"]').click();$('#confirm-accept').click();await idle();assert.equal(qa.state.example,'lab5-q2');assert($('#console-output').textContent.includes('PASS: lab5-q2'));assert($('#diagram-content svg'));
assert.equal(JSON.parse(window.localStorage.getItem('signal.workspace.v1')).example,'lab5-q2');
assert.equal($('#time-limit').value,'1000');
console.log('PASS UI: 71 cards, filters/search, empty state, downloads, real simulations/diagrams, playback, overwrite cancel/accept, persistence.');
await window.happyDOM.close();
