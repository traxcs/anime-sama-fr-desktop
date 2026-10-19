const {
    resolve,
    join
} = require("node:path");
const {
    execSync
} = require("node:child_process");
const builder = require("electron-builder");
const packagejson = require(resolve(join(__dirname, "package.json")));
const repository = String(packagejson.repository?.url || "").split(".git")[0].split("/");
/* Without a token in the environment the GitHub CLI is asked for the one it keeps,
   so a machine signed in once publishes on its own and nothing is typed by hand.
   A missing CLI, or one signed out, simply leaves the build to stay local. */
if (!process.env.GH_TOKEN) {
    try {
        const token = String(execSync("gh auth token", {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"]
        })).trim();
        if (token.length > 0) process.env.GH_TOKEN = token;
    } catch (error) {};
};
let Platform;
if (process.platform == "win32") Platform = builder.Platform.WINDOWS;
if (typeof Platform != "undefined")(async () => await builder.build({
    targets: await Platform.createTarget(),
    publish: process.env.GH_TOKEN ? "always" : "never",
    config: {
        publish: {
            provider: "github",
            owner: repository[repository.length - 2],
            repo: repository[repository.length - 1],
            releaseType: "release"
        },
        appId: `com.${String(packagejson.exeName).toLowerCase()}.desktop`,
        productName: packagejson.displayName,
        copyright: `${packagejson.license} ${new Date().getFullYear().toString() == packagejson.releaseYear ? packagejson.releaseYear : `${packagejson.releaseYear} - ${new Date().getFullYear()}`} ${packagejson.author.name}`,
        removePackageScripts: true,
        win: {
            target: "nsis",
            icon: "icon.ico",
            publisherName: packagejson.author.name,
            artifactName: `${String(packagejson.exeName).replace(/ /g, "-")}.\${ext}`,
            executableName: packagejson.exeName,
            compression: "maximum"
        },
        nsis: {
            differentialPackage: false,
            oneClick: true,
            allowToChangeInstallationDirectory: false,
            installerIcon: "icon.ico",
            uninstallerIcon: "icon.ico",
            installerHeaderIcon: "icon.ico",
            uninstallDisplayName: packagejson.displayName,
            artifactName: `${String(packagejson.exeName).replace(/ /g, "-")}.\${ext}`,
            deleteAppDataOnUninstall: true,
            menuCategory: true,
            createStartMenuShortcut: true,
            createDesktopShortcut: "always",
            shortcutName: packagejson.displayName
        },
        files: [
            "!assets",
            "!dist",
            "!.gitignore",
            "!build.js",
            "!CHANGELOG.md",
            "!package-lock.json",
            "!README.md",
            "**/*",
            "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
            "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
            "!**/node_modules/*.d.ts",
            "!**/node_modules/.bin",
            "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
            "!.editorconfig",
            "!**/._*",
            "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
            "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
            "!**/{appveyor.yml,.travis.yml,circle.yml}",
            "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
        ]
    }
}))();