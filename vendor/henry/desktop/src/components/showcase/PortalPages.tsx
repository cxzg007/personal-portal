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
    const project = content.openSource;
    const merged = project.contributions.filter((item) => item.status === 'merged');
    const pending = project.contributions.filter((item) => item.status === 'open');

    return <article className="site-page-content portal-copy">
        <h1>Projects</h1>
        <p className="contribution-kicker">OPEN SOURCE / 开源贡献</p>
        <h2>{project.name}</h2>
        <p>{project.background}</p>
        <p className="contribution-role">{project.identity}</p>
        <p>{project.roleSummary}</p>
        <p className="contribution-snapshot">截至 {project.snapshotDate} · {merged.length} 个 PR 已合并 · {pending.length} 个 PR 进行中</p>

        <h2>我的贡献</h2>
        {project.contributionThemes.map((theme) => <section className="contribution-chapter" key={theme.id}>
            <h3>{theme.name}</h3>
            <p>{theme.summary}</p>
            <ul className="contribution-links" aria-label={`${theme.name}的公开 PR`}>
                {theme.prNumbers.map((number) => {
                    const contribution = merged.find((item) => item.number === number);
                    return contribution ? <li key={number}>
                        <a href={contribution.url} title={contribution.title} target="_blank" rel="noreferrer">PR #{number} ↗</a>
                    </li> : null;
                })}
            </ul>
        </section>)}
        {pending.length > 0 ? <section className="contribution-chapter">
            <h2>正在推进</h2>
            {pending.map((item) => <p key={item.number}>
                {item.title}<br />
                <a href={item.url} target="_blank" rel="noreferrer">PR #{item.number} · 进行中 ↗</a>
            </p>)}
            <p className="contribution-note">状态记录于 {project.snapshotDate}，后续进展见公开 PR。</p>
        </section> : null}
        <p><a href={project.repositoryUrl} target="_blank" rel="noreferrer">访问 {project.name} 仓库 ↗</a></p>
        <p><a href={project.articlePath} target="_top">阅读我的开源工程复盘 ↗</a></p>
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
