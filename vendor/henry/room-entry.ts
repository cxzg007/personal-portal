import './room/src/style.css';
import Application from './room/src/Application/Application';
import { DefaultLoadingManager } from 'three';

// Keep the decorative videos from competing with the room's boot resources.
// Starting them on the user's click also supplies a media playback gesture.
document.addEventListener('loadingScreenDone', () => {
    document.querySelectorAll<HTMLVideoElement>('#monitor-videos video[data-src]').forEach((video) => {
        video.src = video.dataset.src!;
        delete video.dataset.src;
        void video.play().catch(() => {});
    });
}, { once: true });

const report = (type: string) => window.parent.postMessage({ type }, window.location.origin);
let state = 'loading';
const updateState = (next: string) => { state = next; report(next); };
let roomReady = false;
let desktopReady = false;
const reportReady = () => {
    if (roomReady && desktopReady && state !== 'henry:error') updateState('henry:ready');
};
window.addEventListener('henry:desktop-ready', () => { desktopReady = true; reportReady(); });
window.addEventListener('henry:desktop-error', () => updateState('henry:error'));
window.addEventListener('message', (event) => {
    if (event.origin === window.location.origin && event.source === window.parent && event.data?.type === 'henry:ping' && state !== 'loading') report(state);
});
DefaultLoadingManager.onError = () => updateState('henry:error');
try {
    const app = new Application();
    app.resources.on('ready', () => { roomReady = true; reportReady(); });
    app.renderer.instance.domElement.addEventListener('webglcontextlost', () => updateState('henry:error'));
} catch (error) {
    console.error('The retro room could not start.', error);
    updateState('henry:error');
}
