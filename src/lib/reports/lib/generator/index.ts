import { IGenerator, IReportInfo } from "../../interfaces";
import * as chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { ILogger } from "logger-flx";
import { v4 as uuid } from "uuid";
import { HtmlGenerator } from "./html-generator";
import { InfoGenerator } from "./info-generator";
import { Backup } from "./backup";

export class Generator implements IGenerator {

    private _running_flag: boolean

    constructor (
        private readonly _full_store_folder: string,
        private readonly _full_reports_folder: string,
        private readonly _full_backup_folder: string,
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

        this._running_flag = false;

    }

    async run (project: string): Promise<IReportInfo> {

        if (this._running_flag === true) {
            return;
        }

        this._running_flag = true;

        const full_project_store_path = path.resolve(this._full_store_folder, project);
        const full_project_reports_path = path.resolve(this._full_reports_folder, project);
        const full_uuid_store_path = path.resolve(full_project_store_path, "uuid");
        const full_uuid_reports_path = path.resolve(full_project_reports_path, "uuid");

        if (fs.existsSync(full_project_store_path) === false) {
            this._logger.error(`[Reports] Folder ${chalk.grey(full_project_store_path)} for project ${chalk.grey(project)} not found`);
            this._running_flag = false;
            return;
        }

        if (fs.existsSync(full_uuid_store_path) === false) {
            fs.writeFileSync(full_uuid_store_path, uuid());
        }

        const store_uuid = fs.readFileSync(full_uuid_store_path).toString();

        if (fs.existsSync(full_uuid_reports_path) === true) {

            const http_report_uuid = fs.readFileSync(full_uuid_reports_path).toString();
         
            if (http_report_uuid === store_uuid) {
                this._running_flag = false;
                return;
            }

        }

        try {

            await HtmlGenerator(this._full_store_folder, this._full_reports_folder, project, this._logger);
            const report: IReportInfo = await InfoGenerator(this._full_store_folder, this._full_reports_folder, project, this._logger);
            await Backup(this._full_store_folder, this._full_backup_folder, project, this._logger);

            fs.writeFileSync(full_uuid_reports_path, store_uuid);

            this._running_flag = false;

            return report;

        } catch (error) {
            this._logger.error(`[Reports] Generating report for project ${chalk.grey(project)}. ${error}`);
            this._logger.log(error.stack, "debug");
            this._running_flag = false;
            return;
        }

    }

}