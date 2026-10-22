import React, { useEffect, useRef, useState } from 'react';

import { DosPlayer as Instance, DosPlayerFactoryType } from 'js-dos';

declare const Dos: DosPlayerFactoryType;

let emulator: Promise<void> | undefined;
function loadEmulator() {
    if (!emulator) {
        emulator = new Promise<void>((resolve, reject) => {
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = './js-dos/js-dos.css';
            document.head.appendChild(css);
            const script = document.createElement('script');
            script.src = './js-dos/js-dos.js';
            script.onload = () => {
                (window as any).emulators.pathPrefix = '/experiments/henry/desktop/js-dos/';
                resolve();
            };
            script.onerror = () => { emulator = undefined; reject(new Error('Emulator unavailable')); };
            document.head.appendChild(script);
        });
    }
    return emulator;
}

interface PlayerProps {
    width: number;
    height: number;
    bundleUrl: string;
}

export default function DosPlayer(props: PlayerProps) {
    const rootRef = useRef<HTMLDivElement>(null);

    const [dos, setDos] = useState<Instance | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (rootRef === null || rootRef.current === null) {
            return;
        }

        const root = rootRef.current as HTMLDivElement;
        let cancelled = false;
        let instance: Instance | undefined;
        loadEmulator().then(() => {
            if (cancelled) return;
            instance = Dos(root);
            setDos(instance);
            const elements = root.getElementsByClassName('flex-grow-0');
            while (elements.length > 0) elements[0].remove();
        }).catch(() => { if (!cancelled) setFailed(true); });

        return () => {
            cancelled = true;
            instance?.stop();
        };
    }, [rootRef]);

    useEffect(() => {
        if (dos !== null) {
            dos.run(props.bundleUrl).catch(() => setFailed(true));
        }
    }, [dos, props.bundleUrl]);
    return failed ? <p style={{ padding: 24 }}>游戏加载失败，请关闭窗口后重试。</p> : (
        <div
            ref={rootRef}
            style={{
                width: props.width,
                height: props.height,
                position: 'absolute',
            }}
        ></div>
    );
}
