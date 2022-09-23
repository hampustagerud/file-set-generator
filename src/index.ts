import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import path from "path";
import fs from "fs";

const isTruthy = <T>(input: T | undefined | null): input is T => !!input;

const root = path.resolve(__dirname, "..");
const artifactRoot = path.resolve(root, "generated");

if (!fs.existsSync(artifactRoot)) {
  fs.mkdirSync(artifactRoot);
}

const dirRegexp = /^Set (\d)+$/;

function getHighestExistingSet() {
  return fs
    .readdirSync(artifactRoot)
    .filter((file) =>
      fs.statSync(path.resolve(artifactRoot, file)).isDirectory()
    )
    .map((file) => dirRegexp.exec(file))
    .filter(isTruthy)
    .reduce((acc, [_, v]) => Math.max(acc, parseInt(v)), 0);
}

let counter = getHighestExistingSet() + 1;

const outputRoot = path.resolve(artifactRoot, "Set " + counter);

fs.mkdirSync(outputRoot, { recursive: true });

const templateRoot = path.resolve(root, "templates");
const templates = fs
  .readdirSync(templateRoot)
  .map((file) => path.resolve(templateRoot, file))
  .filter((file) => fs.statSync(file).isFile() && file.endsWith(".docx"));

for (const templatePath of templates) {
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render({ counter });

  const buf = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  fs.writeFileSync(path.resolve(outputRoot, path.basename(templatePath)), buf);
}

const latestLink = path.resolve(artifactRoot, "latest");
if (fs.existsSync(latestLink)) {
  fs.unlinkSync(latestLink);
}

fs.symlinkSync(outputRoot, latestLink, "dir");
