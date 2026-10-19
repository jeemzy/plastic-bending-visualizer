import { readFile, writeFile } from "node:fs/promises";
const names = [
  "react",
  "react-dom",
  "three",
  "lucide-react",
  "@fontsource-variable/dm-sans",
  "@fontsource-variable/manrope",
];
const parts = [
  "Third-party software and font notices\n\nThese licenses cover dependencies distributed with the built application.",
];
for (const name of names)
  parts.push(
    `\n\n${name}\n${"=".repeat(name.length)}\n\n${await readFile(`node_modules/${name}/LICENSE`, "utf8")}`,
  );
await writeFile("public/THIRD_PARTY_NOTICES.txt", parts.join(""));
