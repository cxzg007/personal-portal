import './room/src/style.css';
import Application from './room/src/Application/Application';
import { DefaultLoadingManager } from 'three';

// Keep the decorative videos from competing with the room's boot resources.
// Fetch complete clips at low priority instead of leaving media range streams
// open across iframe removal. This keeps mode changes responsive over HTTP/2.
const videoDownloads = new AbortController();
const videoUrls: string[] = [];
document.addEventListener('loadingScreenDone', () => {
    document.querySelectorAll<HTMLVideoElement>('#monitor-videos video[data-src]').forEach(async (video) => {
        const source = video.dataset.src!;
        delete video.dataset.src;
        try {
            const response = await fetch(source, { signal: videoDownloads.signal, priority: 'low' });
            if (!response.ok) return;
            const clip = await response.blob();
            if (videoDownloads.signal.aborted) return;
            const url = URL.createObjectURL(clip);
            videoUrls.push(url);
            video.src = url;
            await video.play();
        } catch {
            // Noise is decorative; an interrupted clip must not stop the room.
        }
    });
}, { once: true });
window.addEventListener('pagehide', () => {
    videoDownloads.abort();
    document.querySelectorAll<HTMLVideoElement>('#monitor-videos video').forEach((video) => {
        video.pause();
        video.removeAttribute('src');
        video.load();
    });
    videoUrls.forEach((url) => URL.revokeObjectURL(url));
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
