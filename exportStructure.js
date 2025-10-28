/**
 * exportStructure.js
 * Recursively traverses specified folders and writes file paths + contents
 * into a single text file "project_dump.txt"
 */

import fs from "fs";
import path from "path";

const OUTPUT_FILE = "project_dump.txt";

// Folders to include
const INCLUDE_DIRS = ["app", "components", "config", "lib", "prisma"];

const rootDir = process.cwd();
const outputPath = path.join(rootDir, OUTPUT_FILE);

// --- helper: recursively collect file paths ---
function getAllFiles(dirPath) {
  let results = [];
  if (!fs.existsSync(dirPath)) return results;

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    // Skip node_modules or build outputs just in case
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else if (
      /\.(ts|tsx|js|jsx|json|css|scss|prisma|md)$/i.test(file) &&
      !file.includes("project_dump.txt")
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

// --- main ---
function exportFiles() {
  const writeStream = fs.createWriteStream(outputPath);
  writeStream.write(`# === Project Dump (${new Date().toISOString()}) ===\n\n`);

  for (const dir of INCLUDE_DIRS) {
    const fullDir = path.join(rootDir, dir);
    if (!fs.existsSync(fullDir)) continue;

    const files = getAllFiles(fullDir);
    for (const file of files) {
      const relative = path.relative(rootDir, file);
      const content = fs.readFileSync(file, "utf8");
      writeStream.write(`\n# --- ${relative} ---\n`);
      writeStream.write(content.trimEnd());
      writeStream.write(`\n# --- end of ${relative} ---\n`);
    }
  }

  writeStream.end();
  console.log(`✅ Project structure exported to ${OUTPUT_FILE}`);
}

exportFiles();
