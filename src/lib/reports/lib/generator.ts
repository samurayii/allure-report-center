import { IGenerator } from "../interfaces";
import * as chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { ILogger } from "logger-flx";
import { execSync } from "child_process";
import * as rimraf from "rimraf";
import { v4 as uuid } from "uuid";

export class Generator implements IGenerator {

    constructor (
        private readonly _full_store_folder: string,
        private readonly _full_reports_folder: string,
        private readonly _logger: ILogger
    ) {
        
        const files = fs.readdirSync(this._full_store_folder);

        for (const file_path of files) {

            const full_file_path = path.resolve(this._full_store_folder, file_path);
            const stat = fs.statSync(full_file_path);

            if (stat.isDirectory() === true) {
                this.run(file_path);
            }

        }

    }

    run (project: string): void {

        const full_project_store_path = path.resolve(this._full_store_folder, project);
        const full_project_reports_path = path.resolve(this._full_reports_folder, project);
        const full_uuid_store_path = path.resolve(full_project_store_path, "uuid");
        const full_uuid_reports_path = path.resolve(full_project_reports_path, "uuid");

        if (fs.existsSync(full_uuid_store_path) === false) {
            fs.writeFileSync(full_uuid_store_path, uuid());
        }

        if (fs.existsSync(full_project_store_path) === false) {
            this._logger.error(`[Reports] Folder ${chalk.grey(full_project_store_path)} for project ${chalk.grey(project)} not found`);
            return;
        }

        const store_uuid = fs.readFileSync(full_uuid_store_path).toString();

        if (fs.existsSync(full_uuid_reports_path) === true) {

            const http_report_uuid = fs.readFileSync(full_uuid_reports_path).toString();
         
            if (http_report_uuid === store_uuid) {
                return;
            }

        }

        this._logger.log(`[Reports] Generating report for project ${chalk.grey(project)}`, "dev");

        if (fs.existsSync(full_project_reports_path) === true) {

            try {
                rimraf.sync(full_project_reports_path);
                this._logger.log(`[Reports] Old folder for project ${chalk.grey(project)} deleted`, "dev");
            } catch (error) {
                this._logger.error(`[Reports] Generating report for project ${chalk.grey(project)}. ${error}`);
                this._logger.log(error.stack, "debug");
                return;
            }

        }

        try {

            this._logger.log(`[Reports] Generating html report for project ${chalk.grey(project)}`, "dev");

            const exec = `allure generate --report-dir ${full_project_reports_path}`;

            this._logger.log(`[Reports] Exec: ${exec}`, "dev");

            const stdout = execSync(exec, {
                cwd: full_project_store_path
            });

            this._logger.log(stdout.toString());

            this._logger.log(`[Reports] Http report for project ${chalk.grey(project)} generated`, "dev");

            fs.writeFileSync(full_uuid_reports_path, store_uuid);

        } catch (error) {
            this._logger.error(`[Reports] Generating report for project ${chalk.grey(project)}. ${error}`);
            this._logger.log(error.stack, "debug");
            return;
        }

    }

}