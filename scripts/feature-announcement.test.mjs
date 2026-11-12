import test from 'node:test';
import assert from 'node:assert/strict';
import { installFeatureAnnouncement } from '../site/feature-announcement.js';

// Exercise the installer with the same auth and feed events used by the app.
test('Following announcement stays private to signed-in For You, including manual previews and logout', async () => {
  const original = Object.fromEntries(['document','window','localStorage','sessionStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  let signedIn = false, scrolls = 0, focuses = 0;
  const windowListeners = new Map(), buttonListeners = new Map();
  const listeners = new Map(), stored = new Map();
  const button = {addEventListener:(name, fn)=>buttonListeners.set(name,fn),focus(){focuses++;}};
  const announcement = {hidden:true,dataset:{},querySelector:selector=>selector==='button'?button:{addEventListener(){}},getAnimations:()=>[],scrollIntoView(){scrolls++;}};
  const doc = {body:{dataset:{feedView:'for-you'}},querySelector:selector=>selector==='[data-feature-announcement]'?announcement:null,addEventListener:(name,fn)=>listeners.set(name,fn)};
  Object.defineProperty(globalThis,'document',{value:doc,configurable:true});
  Object.defineProperty(globalThis,'window',{value:{isSignedIn:()=>signedIn,addEventListener:(name,fn)=>windowListeners.set(name,fn)},configurable:true});
  Object.defineProperty(globalThis,'localStorage',{value:{getItem:key=>stored.get(key),removeItem:key=>stored.delete(key),setItem:(key,value)=>stored.set(key,value)},configurable:true});
  Object.defineProperty(globalThis,'sessionStorage',{value:{getItem:key=>stored.get(key) ?? null,removeItem:key=>stored.delete(key),setItem:(key,value)=>stored.set(key,value)},configurable:true});
  try {
    const controls = installFeatureAnnouncement();
    assert.equal(announcement.hidden,true,'signed-out Discover hides the announcement');
    controls.show();
    assert.equal(announcement.hidden,true,'manual preview cannot expose it while signed out');
    assert.equal(scrolls+focuses,0,'hidden announcement never steals focus or scrolls');
    signedIn=true;listeners.get('auth-change')();
    assert.equal(announcement.hidden,true,'sign-in or account creation does not reveal the card');
    controls.show();
    assert.equal(announcement.hidden,false,'explicit settings invocation reveals it');
    doc.body.dataset.feedView='following';listeners.get('feed-view-selected')();
    assert.equal(announcement.hidden,true,'other signed-in tabs hide it');
    doc.body.dataset.feedView='for-you';listeners.get('feed-view-selected')();
    assert.equal(announcement.hidden,false);
    signedIn=false;listeners.get('auth-change')();
    assert.equal(announcement.hidden,true,'logout hides it immediately');
    signedIn=true;listeners.get('auth-change')();
    assert.equal(announcement.hidden,true,'signing back in does not restore the preview');
    controls.show();
    assert.equal(announcement.hidden,false);
    await buttonListeners.get('click')();
    assert.equal(announcement.hidden,true,'dismissal hides the manual preview');
    controls.show();
    assert.equal(announcement.hidden,false,'settings can invoke it again');
    installFeatureAnnouncement();
    assert.equal(announcement.hidden,true,'reload starts hidden after a manual preview');
  } finally {
    for (const [key,descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key];
    }
  }
});
