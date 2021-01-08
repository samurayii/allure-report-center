import * as chalk from "chalk";
import * as path from "path";
import * as fs from "fs";
import { ILogger } from "logger-flx";
import { execSync } from "child_process";

export async function HtmlGenerator (full_store_folder: string, full_reports_folder:string, project: string, logger: ILogger): Promise<void> {

    const full_project_store_path = path.resolve(full_store_folder, project);
    const full_project_store_history_path = path.resolve(full_project_store_path, "allure-results/history");
    const full_project_reports_path = path.resolve(full_reports_folder, project);
    const full_project_reports_history_path = path.resolve(full_project_reports_path, "history");

    logger.log(`[Reports] Generating html report for project ${chalk.grey(project)}`, "dev");

    if (fs.existsSync(full_project_reports_history_path) === true) {

        if (fs.existsSync(full_project_store_history_path) === false) {
            fs.mkdirSync(full_project_store_history_path, {
                recursive: true
            });
            logger.log(`[Reports] Create history folder for project ${chalk.grey(project)}`, "dev");
        }

        const files = fs.readdirSync(full_project_reports_history_path);

        for (const file_path of files) {

            const full_report_file_path = path.resolve(full_project_reports_history_path, file_path);
            const full_store_file_path = path.resolve(full_project_store_history_path, file_path);

            const body = fs.readFileSync(full_report_file_path);

            fs.writeFileSync(full_store_file_path, body);

            logger.log(`[Reports] Write history file ${chalk.grey(file_path)} for project ${chalk.grey(project)} to ${chalk.grey(full_store_file_path)}`, "dev");

        }

    }

    const exec = `allure generate --clean --report-dir ${full_project_reports_path}`;

    logger.log(`[Reports] Exec: ${exec}`, "dev");

    execSync(exec, {
        cwd: full_project_store_path
    });

    logger.log(`[Reports] Html report for project ${chalk.grey(project)} generated`, "dev");

}