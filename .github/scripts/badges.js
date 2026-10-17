const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const repository = process.env.GITHUB_REPOSITORY || "traxcs/anime-sama-fr-desktop";
const token = process.env.GITHUB_TOKEN;
const root = path.join(__dirname, "..", "..");
const readme = path.join(root, "README.md");
const packagejson = require(path.join(root, "package.json"));
const color = "007ec6";

const api = async endpoint => {
    const response = await fetch(`https://api.github.com/${endpoint}`, {
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${token}`,
            "User-Agent": "badges"
        }
    });
    if (!response.ok) throw new Error(`${endpoint} answered ${response.status}`);
    return await response.json();
};
const count = async query => (await api(`search/issues?per_page=1&q=${encodeURIComponent(`repo:${repository} ${query}`)}`)).total_count;
const git = command => childProcess.execSync(command, {
    cwd: root,
    encoding: "utf8"
}).trim();
const readableSize = bytes => {
    const units = ["B", "KiB", "MiB", "GiB"];
    let unit = 0;
    let size = bytes;
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit++;
    };
    return `${size.toFixed(1)} ${units[unit]}`;
};
const escape = value => encodeURIComponent(String(value).replace(/-/g, "--").replace(/_/g, "__"));
const shield = (label, value) => `https://img.shields.io/badge/${escape(label)}-${escape(value)}-${color}`;

(async () => {
    const repositoryUrl = `https://github.com/${repository}`;
    const [repositoryData, languages, releases, contributors] = await Promise.all([
        api(`repos/${repository}`),
        api(`repos/${repository}/languages`),
        api(`repos/${repository}/releases?per_page=100`),
        api(`repos/${repository}/contributors?per_page=100`)
    ]);
    const published = releases.filter(release => release.draft != true);
    const latest = published.find(release => release.prerelease != true) || published[0];
    const downloads = release => (release?.assets || []).reduce((total, asset) => total + asset.download_count, 0);
    const codeSize = Object.values(languages).reduce((total, bytes) => total + bytes, 0);
    const topLanguage = Object.entries(languages).sort((first, second) => second[1] - first[1])[0];
    const badges = [{
        id: "last-commit",
        alt: "Last commit",
        href: `${repositoryUrl}/commits/${repositoryData.default_branch}`,
        label: "last commit",
        value: git("git log -1 --format=%cs")
    }, {
        id: "release-date",
        alt: "Release date",
        href: `${repositoryUrl}/releases/latest`,
        label: "release date",
        value: latest ? latest.published_at.slice(0, 10) : "none"
    }, {
        id: "downloads",
        alt: "Downloads",
        label: "downloads",
        value: published.reduce((total, release) => total + downloads(release), 0)
    }, {
        id: "downloads-latest",
        alt: "Downloads@latest",
        label: "downloads@latest",
        value: downloads(latest)
    }, {
        id: "contributors",
        alt: "Contributors",
        href: `${repositoryUrl}/graphs/contributors`,
        label: "contributors",
        value: contributors.length
    }, {
        id: "open-issues",
        alt: "Open issues",
        href: `${repositoryUrl}/issues?q=is%3Aopen+is%3Aissue`,
        label: "open issues",
        value: await count("is:issue is:open")
    }, {
        id: "closed-issues",
        alt: "Closed issues",
        href: `${repositoryUrl}/issues?q=is%3Aissue+is%3Aclosed`,
        label: "closed issues",
        value: await count("is:issue is:closed")
    }, {
        id: "open-pull-requests",
        alt: "Open pull requests",
        href: `${repositoryUrl}/pulls?q=is%3Aopen+is%3Apr`,
        label: "open pull requests",
        value: await count("is:pr is:open")
    }, {
        id: "closed-pull-requests",
        alt: "Closed pull requests",
        href: `${repositoryUrl}/pulls?q=is%3Apr+is%3Aclosed`,
        label: "closed pull requests",
        value: await count("is:pr is:closed")
    }, {
        id: "commit-activity-by-week",
        alt: "Commit activity by week",
        label: "commit activity",
        value: `${git("git rev-list --count --since=\"7 days ago\" HEAD")}/week`
    }, {
        id: "commit-activity-by-month",
        alt: "Commit activity by month",
        label: "commit activity",
        value: `${git("git rev-list --count --since=\"30 days ago\" HEAD")}/month`
    }, {
        id: "version",
        alt: "Version",
        label: "version",
        value: `v${packagejson.version}`
    }, {
        id: "main-file",
        alt: "Main file",
        href: `./${packagejson.main}`,
        label: "main",
        value: packagejson.main
    }, {
        id: "languages",
        alt: "Languages",
        label: "languages",
        value: Object.keys(languages).length
    }, {
        id: "top-language",
        alt: "Top language",
        label: topLanguage ? topLanguage[0].toLowerCase() : "language",
        value: topLanguage ? `${(topLanguage[1] / codeSize * 100).toFixed(1)}%` : "none"
    }, {
        id: "license",
        alt: "License",
        href: "./LICENSE",
        label: "license",
        value: repositoryData.license?.spdx_id || "none"
    }, {
        id: "code-size",
        alt: "Code size",
        label: "code size",
        value: readableSize(codeSize)
    }, {
        id: "repo-size",
        alt: "Repo size",
        label: "repo size",
        value: readableSize(repositoryData.size * 1024)
    }, {
        id: "watchers",
        alt: "Watchers",
        href: `${repositoryUrl}/watchers`,
        label: "watchers",
        value: repositoryData.subscribers_count
    }, {
        id: "stars",
        alt: "Stars",
        href: `${repositoryUrl}/stargazers`,
        label: "stars",
        value: repositoryData.stargazers_count
    }, {
        id: "forks",
        alt: "Forks",
        href: `${repositoryUrl}/network/members`,
        label: "forks",
        value: repositoryData.forks_count
    }];
    const block = badges.map(badge => [
        `    <a id="readme-shield-${badge.id}"${badge.href ? ` href="${badge.href}"` : ""}>`,
        `        <img id="readme-shield-${badge.id}-img" src="${shield(badge.label, badge.value)}" alt="${badge.alt}" />`,
        "    </a>"
    ].join("\n")).join("\n");
    const content = fs.readFileSync(readme, "utf8");
    const start = "<!-- badges:start -->";
    const end = "<!-- badges:end -->";
    if (content.includes(start) == false || content.includes(end) == false) throw new Error("the badge markers are missing from the README");
    const updated = `${content.slice(0, content.indexOf(start) + start.length)}\n${block}\n${content.slice(content.indexOf(end))}`;
    if (updated == content) return console.log("the badges are already up to date");
    fs.writeFileSync(readme, updated);
    console.log("the badges have been updated");
})().catch(error => {
    console.error(error.message);
    process.exit(1);
});
