import { spawn } from "child_process";
import * as pkg from "./package.json";

const command = `docker push ${pkg.docker_image}:latest`;

console.log(`cwd:  ${__dirname}`);
console.log(`exec:  ${command}`);

spawn(command, [], {
    cwd: __dirname,
    shell: true,
    stdio: ["inherit", "inherit", "inherit"]
});