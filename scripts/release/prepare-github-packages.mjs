import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const outputDir = resolve(rootDir, ".github-packages");
const rootLicensePath = resolve(rootDir, "LICENSE");

const packageConfigs = [
  {
    sourceDir: resolve(rootDir, "packages/core"),
    sourceName: "@window-manager/core",
    mirrorName: "@siriusbinarydev/window-manager-core",
  },
  {
    sourceDir: resolve(rootDir, "packages/react"),
    sourceName: "@window-manager/react",
    mirrorName: "@siriusbinarydev/window-manager-react",
  },
];

const packageJsonBySourceName = new Map(
  packageConfigs.map((config) => [
    config.sourceName,
    JSON.parse(readFileSync(join(config.sourceDir, "package.json"), "utf8")),
  ]),
);

const mirrorNameBySourceName = new Map(
  packageConfigs.map((config) => [config.sourceName, config.mirrorName]),
);

function rewriteWorkspaceVersion(name, version) {
  if (typeof version !== "string" || !version.startsWith("workspace:")) {
    return version;
  }

  const packageJson = packageJsonBySourceName.get(name);
  if (!packageJson) {
    return version;
  }

  const range = version.slice("workspace:".length);

  if (range === "^" || range === "~") {
    return `${range}${packageJson.version}`;
  }

  if (range === "*" || range === "") {
    return packageJson.version;
  }

  return range;
}

function rewriteDependencyMap(dependencies) {
  if (!dependencies) {
    return dependencies;
  }

  return Object.fromEntries(
    Object.entries(dependencies).map(([name, version]) => [
      mirrorNameBySourceName.get(name) ?? name,
      rewriteWorkspaceVersion(name, version),
    ]),
  );
}

function getMirrorScripts(scripts) {
  if (!scripts) {
    return undefined;
  }

  const {
    prepublishOnly: _prepublishOnly,
    prepare: _prepare,
    prepack: _prepack,
    postpack: _postpack,
    build: _build,
    test: _test,
    lint: _lint,
    typecheck: _typecheck,
    ...remainingScripts
  } = scripts;

  return Object.keys(remainingScripts).length > 0 ? remainingScripts : undefined;
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

for (const config of packageConfigs) {
  const packageJsonPath = join(config.sourceDir, "package.json");
  const readmePath = join(config.sourceDir, "README.md");
  const packageLicensePath = join(config.sourceDir, "LICENSE");
  const distDir = join(config.sourceDir, "dist");

  if (!existsSync(distDir)) {
    throw new Error(`Expected build output at ${distDir}. Run the workspace build first.`);
  }

  const packageJson = packageJsonBySourceName.get(config.sourceName);
  const mirrorDir = join(outputDir, config.mirrorName.split("/")[1]);

  mkdirSync(mirrorDir, { recursive: true });
  cpSync(distDir, join(mirrorDir, "dist"), { recursive: true });

  if (existsSync(readmePath)) {
    cpSync(readmePath, join(mirrorDir, "README.md"));
  }

  if (existsSync(packageLicensePath)) {
    cpSync(packageLicensePath, join(mirrorDir, "LICENSE"));
  } else if (existsSync(rootLicensePath)) {
    cpSync(rootLicensePath, join(mirrorDir, "LICENSE"));
  }

  const mirrorPackageJson = {
    ...packageJson,
    name: config.mirrorName,
    publishConfig: {
      ...packageJson.publishConfig,
      registry: "https://npm.pkg.github.com",
    },
    scripts: getMirrorScripts(packageJson.scripts),
    dependencies: rewriteDependencyMap(packageJson.dependencies),
    optionalDependencies: rewriteDependencyMap(packageJson.optionalDependencies),
    peerDependencies: rewriteDependencyMap(packageJson.peerDependencies),
    devDependencies: undefined,
  };

  writeFileSync(
    join(mirrorDir, "package.json"),
    `${JSON.stringify(mirrorPackageJson, null, 2)}\n`,
  );
}

writeFileSync(
  join(outputDir, "manifest.json"),
  `${JSON.stringify(
    packageConfigs.map((config) => ({
      sourceName: config.sourceName,
      mirrorName: config.mirrorName,
      directory: config.mirrorName.split("/")[1],
    })),
    null,
    2,
  )}\n`,
);
