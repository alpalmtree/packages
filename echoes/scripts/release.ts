import { currentVersion } from "./current_version.ts";

type ChangeType = "patch" | "minor" | "major";

const changeType: ChangeType = Deno.args.at(0) as ChangeType;
if (!changeType || !["patch", "minor", "major"].includes(changeType)) {
  Deno.exit();
}

const versionNumber: number[] = currentVersion.slice(1).split(".").map(Number);

const versioningTypes: { [K in ChangeType]: (() => number[]) } = {
  patch: () => {
    return versionNumber.map((num, index) => {
      if (index !== 2) return num;
      return ++num;
    });
  },
  minor: () => {
    return versionNumber.map((num, index) => {
      if (index == 2) return 0;
      if (index == 0) return num;
      return ++num;
    });
  },
  major: () => {
    return versionNumber.map((num, index) => {
      if (index !== 0) return 0;
      return ++num;
    });
  },
};

const newVersion = `v${versioningTypes[changeType]().join(".")}`;

const currentVersionFile = Deno.readTextFileSync(
  `${Deno.cwd()}/scripts/current_version.ts`,
);
const readme = Deno.readTextFileSync(`${Deno.cwd()}/README.md`);

await Promise.all([
  Deno.writeTextFile(
    `${Deno.cwd()}/scripts/current_version.ts`,
    currentVersionFile.replace(currentVersion, newVersion),
  ),
  Deno.writeTextFile(
    `${Deno.cwd()}/README.md`,
    readme.replaceAll(currentVersion, newVersion),
  ),
]);

new Deno.Command("git", {
  args: `add .`.split(" "),
}).outputSync();

new Deno.Command("git", {
  args: `commit -m "release:${newVersion}"`.split(" "),
}).outputSync();

new Deno.Command("git", {
  args: `tag ${newVersion}`.split(" "),
}).outputSync();

new Deno.Command("git", {
  args: `push --atomic origin main ${newVersion}`.split(" "),
}).spawn();
