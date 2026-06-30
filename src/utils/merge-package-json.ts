import mergeJsonStr from "merge-packages";
import fs from "fs";

export function mergePackageJson(targetPackageJsonPath: string, secondPackageJsonPath: string) {
  const existsTarget = fs.existsSync(targetPackageJsonPath);
  const existsSecond = fs.existsSync(secondPackageJsonPath);
  if (!existsTarget && !existsSecond) {
    return;
  }

  const targetPackageJson = existsTarget ? fs.readFileSync(targetPackageJsonPath, "utf8") : "{}";

  const secondPackageJson = existsSecond ? fs.readFileSync(secondPackageJsonPath, "utf8") : "{}";

  const mergedPkgStr = mergeJsonStr.default(targetPackageJson, secondPackageJson);

  const formattedPkgStr = JSON.stringify(JSON.parse(mergedPkgStr), null, 2);

  fs.writeFileSync(targetPackageJsonPath, formattedPkgStr, "utf8");
}
