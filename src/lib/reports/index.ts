import { ILogger } from "logger-flx";
import { IGenerator, IReports, IReportsConfig } from "./interfaces";
import { Generator } from "./lib/generator";
import * as chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import * as rimraf from "rimraf";
import { CronJob } from "cron";
import { v4 as uuid } from "uuid";

export * from "./interfaces";

export class Reports implements IReports {

    private readonly _generator: IGenerator
    private _projects: string[]
    private readonly _full_store_folder: string
    private readonly _full_reports_folder: string
    private _job: CronJob
    private _running_flag: boolean

    constructor (
        private readonly _config: IReportsConfig,
        private readonly _logger: ILogger
    ) {

        this._full_store_folder = path.resolve(process.cwd(), this._config.store_folder);
        this._full_reports_folder = path.resolve(process.cwd(), this._config.http_folder);
        this._running_flag = false;

        if (fs.existsSync(this._full_store_folder) === false) {
            fs.mkdirSync(this._full_store_folder, {
                recursive: true
            });
            this._logger.log(`[Reports] Folder ${chalk.grey(this._full_store_folder)} created`, "dev");
        }

        if (fs.existsSync(this._full_reports_folder) === false) {
            fs.mkdirSync(this._full_reports_folder, {
                recursive: true
            });
            this._logger.log(`[Reports] Folder ${chalk.grey(this._full_reports_folder)} created`, "dev");
        }

        this._generator = new Generator(this._full_store_folder, this._full_reports_folder, this._logger);

        this._projects = fs.readdirSync(this._full_store_folder);

        this._job = new CronJob(this._config.cron.interval, () => {
            this._generate();
        },
        null,
        false,
        this._config.cron.time_zone);

        this._generate();

    }

    getProjects (): string[] {
        return this._projects;
    }

    async getReports (project: string): Promise<string[]> {

        if (this._projects.includes(project) === false) {
            return;
        }

        const full_store_path = path.resolve(this._full_store_folder, `${project}/allure-results`);

        if (fs.existsSync(full_store_path) === false) {
            return;
        }

        return await fs.promises.readdir(full_store_path);

    }

    close (): void {
        if (this._running_flag === false) {
            return;
        }
        this._running_flag = false;
        this._job.stop();
    }

    run (): void {
        if (this._running_flag === true) {
            return;
        }
        this._running_flag = true;
        this._job.start();
    }

    addReport (project: string, report: string, body: string): void {

        if (this._projects.includes(project) === false) {
            return;
        }

        const full_store_path = path.resolve(this._full_store_folder, `${project}/allure-results`);

        if (fs.existsSync(full_store_path) === false) {
            return;
        }

        const full_report_path = path.resolve(full_store_path, report);
        const full_uuid_path = path.resolve(this._full_store_folder, `${project}/uuid`);
        const full_report_dirname = path.dirname(full_report_path);

        if (fs.existsSync(full_report_dirname) === false) {
            fs.mkdirSync(full_report_dirname, {
                recursive: true
            });
        }

        try {

            fs.writeFileSync(full_report_path, body);
            fs.writeFileSync(full_uuid_path, uuid());

            this._logger.log(`[Reports] Report ${chalk.grey(full_report_path)} saved`, "dev");

        } catch (error) {
            this._logger.error(`[Reports] Saving report ${chalk.grey(full_report_path)}. ${error}`);
            this._logger.log(error.stack, "debug");
        }

    }

    existProject (project: string): boolean {
        return this._projects.includes(project);
    }

    deleteProject (project: string): void {

        if (this._projects.includes(project) === false) {
            return;
        }

        const full_store_path = path.resolve(this._full_store_folder, project);
        const full_reports_path = path.resolve(this._full_reports_folder, project);

        try {

            if (fs.existsSync(full_store_path) === true) {
                rimraf.sync(full_store_path);
                this._logger.log(`[Reports] Store folder ${chalk.grey(project)} deleted`, "dev");
            }

        } catch (error) {
            this._logger.error(`[Reports] Deleting store folder ${chalk.grey(project)}. ${error}`);
            this._logger.log(error.stack, "debug");
        }

        try {

            if (fs.existsSync(full_reports_path) === true) {
                rimraf.sync(full_reports_path);
                this._logger.log(`[Reports] Report folder ${chalk.grey(project)} deleted`, "dev");
            }          

        } catch (error) {
            this._logger.error(`[Reports] Deleting reports folder ${chalk.grey(project)}. ${error}`);
            this._logger.log(error.stack, "debug");
        }

        this._projects.splice(this._projects.indexOf(project), 1);

    }

    existReport (project: string, report: string): boolean {

        if (this._projects.includes(project) === false) {
            return;
        }

        const full_store_path = path.resolve(this._full_store_folder, `${project}/allure-results`);

        if (fs.existsSync(full_store_path) === false) {
            return false;
        }

        const full_report_path = path.resolve(full_store_path, report);

        return fs.existsSync(full_report_path);
    }

    async getReport (project: string, report: string): Promise<string> {

        if (this._projects.includes(project) === false) {
            return;
        }

        const full_store_path = path.resolve(this._full_store_folder, `${project}/allure-results`);

        if (fs.existsSync(full_store_path) === false) {
            return;
        }

        const full_report_path = path.resolve(full_store_path, report);
        const result = await fs.promises.readFile(full_report_path);

        return result.toString();
    }

    deleteReport (project: string, report: string): void {

        if (this._projects.includes(project) === false) {
            return;
        }

        const full_store_path = path.resolve(this._full_store_folder, `${project}/allure-results`);

        if (fs.existsSync(full_store_path) === false) {
            return;
        }

        const full_report_path = path.resolve(full_store_path, report);
        const full_uuid_path = path.resolve(this._full_store_folder, `${project}/uuid`);

        if (fs.existsSync(full_report_path) === false) {
            return;
        }

        try {

            fs.unlinkSync(full_report_path);
            fs.writeFileSync(full_uuid_path, uuid());

            this._logger.log(`[Reports] Report ${chalk.grey(full_report_path)} deleted`, "dev");

        } catch (error) {
            this._logger.error(`[Reports] Deleting report ${chalk.grey(full_report_path)}. ${error}`);
            this._logger.log(error.stack, "debug");
        }

        const files = fs.readdirSync(full_store_path);

        for (const file_path of files) {
            if (file_path !== "uuid") {
                return;
            }
        }

        this.deleteProject(project);

    }

    _generate (): void {

        for (const project of this._projects) {
            this._generator.run(project);
        }

    }

}