import { program } from "commander";
import * as chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import * as finder from "find-package-json";
import * as Ajv from "ajv";
import jtomler from "jtomler";
import json_from_schema from "json-from-default-schema";
import * as auth_user_schema from "./schemes/auth_user.json";
import * as config_schema from "./schemes/config.json";
import { IAppConfig } from "./config.interface";
import { execSync } from "child_process";
 
const pkg = finder(__dirname).next().value;

program.version(`version: ${pkg.version}`, "-v, --version", "output the current version.");
program.name(pkg.name);
program.option("-c, --config <type>", "Path to config file. (Environment variable: ALLURE_REPORT_CENTER_CONFIG_PATH=<type>)");

program.parse(process.argv);

if (process.env["ALLURE_REPORT_CENTER_CONFIG_PATH"] === undefined) {
	if (program.config === undefined) {
		console.error(chalk.red("[ERROR] Not set --config key"));
		process.exit(1);
	}
} else {
	program.config = process.env["ALLURE_REPORT_CENTER_CONFIG_PATH"];
}

const full_config_path = path.resolve(process.cwd(), program.config);

if (!fs.existsSync(full_config_path)) {
    console.error(chalk.red(`[ERROR] Config file ${full_config_path} not found`));
    process.exit(1);
}

const config: IAppConfig = <IAppConfig>json_from_schema(jtomler(full_config_path), config_schema);

for (const item of config.authorization.users) {

    const ajv_user_item = new Ajv();
    const validate_user_item = ajv_user_item.compile(auth_user_schema);

    if (!validate_user_item(item)) {
        console.error(chalk.red(`[ERROR] Config authorization.users parsing error. Schema errors:\n${JSON.stringify(validate_user_item.errors, null, 2)}`));
        process.exit(1);
    }

}

const ajv = new Ajv();
const validate = ajv.compile(config_schema);

if (!validate(config)) {
    console.error(chalk.red(`[ERROR] Schema errors:\n${JSON.stringify(validate.errors, null, 2)}`));
    process.exit(1);
}

try { 
    execSync("allure --version");
} catch (error) {
    console.error(`${chalk.red("[ERROR]")} Can not exec command ${chalk.cyan("allure --version")}, error: ${error}`);
    process.exit(1);
}

export default config;