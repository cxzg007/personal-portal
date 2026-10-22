import './desktop/src/index';
import './desktop/src/portal.css';

const origin = window.location.origin;
window.addEventListener('message', (event) => {
    if (event.origin === origin && event.source === window.parent && event.data?.type === 'henry:ping') {
        window.parent.postMessage({ type: 'henry:ready' }, origin);
    }
});
// The original monitor maps these events from its CSS3D iframe to the 3D camera.
for (const type of ['mousemove', 'mousedown', 'mouseup', 'keydown', 'keyup']) {
    window.addEventListener(type, (event: MouseEvent & KeyboardEvent) => {
        window.parent.postMessage({ type, clientX: event.clientX, clientY: event.clientY, key: event.key }, origin);
    });
}
window.parent.postMessage({ type: 'henry:ready' }, origin);
