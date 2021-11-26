import './style-script/style-script'; // NEVER REMOVE THIS
import { appInstance } from './pwa/app';
import { feedInit } from './pwa/feed';

console.log('script loads!');
appInstance();
feedInit();
