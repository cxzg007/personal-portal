import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Home from '../showcase/Home';
import { About, Experience, Projects, Contact } from '../showcase/PortalPages';
import Window from '../os/Window';
import VerticalNavbar from '../showcase/VerticalNavbar';
import useInitialWindowSize from '../../hooks/useInitialWindowSize';

export default function ShowcaseExplorer(props: WindowAppProps) {
    const { initWidth, initHeight } = useInitialWindowSize({ margin: 100 });
    return (
        <Window top={24} left={56}
            width={initWidth} height={initHeight}
            windowTitle="Jiang Junjie - Personal Showcase"
            windowBarIcon="windowExplorerIcon"
            closeWindow={props.onClose} onInteract={props.onInteract} minimizeWindow={props.onMinimize}
            bottomLeftText="Jiang Junjie · Personal Space">
            <MemoryRouter>
                <div className="site-page">
                    <VerticalNavbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/experience" element={<Experience />} />
                        <Route path="/projects/*" element={<Projects />} />
                        <Route path="/contact" element={<Contact />} />
                    </Routes>
                </div>
            </MemoryRouter>
        </Window>
    );
}
