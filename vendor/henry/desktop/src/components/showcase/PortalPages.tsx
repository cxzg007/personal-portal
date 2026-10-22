import React from 'react';
import content from '../../../../../../content/site-content.json';

export function About() {
    return <article className="site-page-content portal-copy">
        <h1>About me</h1>
        <p><a href="/about" target="_top">了解更多 ↗</a></p>
        <h2>{content.profile.name} / Jiang Junjie</h2>
        <p>{content.profile.positioning}</p>
        {content.about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <h2>Education</h2>
        {content.profile.education.map((item) => <section key={item.degree}>
            <h3>{item.school} · {item.degree}</h3>
            <p>{item.major} / {item.graduationYear}</p>
        </section>)}
    </article>;
}

export function Experience() {
    return <article className="site-page-content portal-copy">
        <h1>Experience</h1>
        {content.internships.map((item) => <section key={item.company}>
            <h2>{item.company}</h2>
            <p>{item.role} · {item.period}</p>
            <h3>{item.valueHeadline}</h3>
            <p>{item.context}</p>
            <ul>{item.highlights.map((point) => <li key={point}>{point}</li>)}</ul>
        </section>)}
    </article>;
}

export function Projects() {
    return <article className="site-page-content portal-copy">
        <h1>Projects</h1>
        {content.caseStudies.map((item) => <section key={item.id}>
            <h2>{item.title}</h2><p>{item.problem}</p><p>{item.result}</p>
            <p className="portal-stack">{item.stack.join(' / ')}</p>
        </section>)}
        <h2>Writing</h2>
        <p><a href="/blog" target="_top">阅读我的技术博客 ↗</a></p>
        <h2>Open source</h2>
        <p><a href={content.openSource.repositoryUrl} target="_blank" rel="noreferrer">{content.openSource.name} ↗</a></p>
    </article>;
}

export function Contact() {
    return <article className="site-page-content portal-copy">
        <h1>Let's talk.</h1>
        <h2>{content.profile.recruitingStatus}</h2>
        <p>一起构建可靠的 AI 系统。</p>
        <p><a href={`mailto:${content.profile.email}`}>{content.profile.email}</a></p>
        <p><a href={content.profile.github} rel="noreferrer" target="_blank">GitHub / {content.profile.technicalId} ↗</a></p>
        <p><a href="/about#contact" target="_top">联系我 ↗</a></p>
    </article>;
}
