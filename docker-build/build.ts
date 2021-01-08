import { spawn } from "child_process";
import * as pkg from "./package.json";

const command = `docker build -t ${pkg.docker_image}:${pkg.version} .`;

console.log(`cwd:  ${__dirname}`);
console.log(`exec:  ${command}`);

spawn(command, [], {
    cwd: __dirname,
    shell: true,
    stdio: ["inherit", "inherit", "inherit"]
});