import * as chalk from "chalk";
import * as path from "path";
import * as fs from "fs";
import { ILogger } from "logger-flx";

export async function Backup (full_store_folder: string, full_backup_folder: string, project: string, logger: ILogger): Promise<void> {

    const full_project_allure_path = path.resolve(full_store_folder, `${project}/allure-results`);
    const full_project_backup_path = path.resolve(full_backup_folder, `${project}/${(new Date()).getTime()}`);

    logger.log(`[Reports] Backup test files for project ${chalk.grey(project)}`, "dev");

    if (fs.existsSync(full_project_backup_path) === false) {
        fs.mkdirSync(full_project_backup_path, {
            recursive: true
        });
        logger.log(`[Reports] Folder ${chalk.grey(full_project_backup_path)} for project ${chalk.grey(project)} created`, "dev");
    }  

    const files = fs.readdirSync(full_project_allure_path);

    for (const file_path of files) {

        const full_file_src_path = path.resolve(full_project_allure_path, file_path);
        const full_file_dest_path = path.resolve(full_project_backup_path, file_path);
        const stat = fs.statSync(full_file_src_path);

        if (stat.isFile() === true) {
            fs.copyFileSync(full_file_src_path, full_file_dest_path);
            logger.log(`[Reports] File ${chalk.grey(full_file_src_path)} backup to ${chalk.grey(full_file_dest_path)}`, "dev");
        }

    }

    fs.rmdirSync(full_project_allure_path, {
        recursive: true
    });

    logger.log(`[Reports] Backup test files for project ${chalk.grey(project)} complete`, "dev");

}