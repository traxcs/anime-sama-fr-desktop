const {
    resolve,
    join
} = require("node:path");
const builder = require("electron-builder");
const packagejson = require(resolve(join(__dirname, "package.json")));
const repository = String(packagejson.repository?.url || "").split(".git")[0].split("/");
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