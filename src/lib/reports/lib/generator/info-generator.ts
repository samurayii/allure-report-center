import * as chalk from "chalk";
import { ILogger } from "logger-flx";
import * as fs from "fs";
import * as path from "path";
import * as xml2js from "xml2js";
import { IReportInfo } from "../../interfaces";

const getXmlFilesList = (folder: string, files_list: string[]  = []) => {

    const files = fs.readdirSync(folder);

    files.forEach( (file_path) => {

        const full_file_path = path.resolve(folder, file_path);
        const stat = fs.statSync(full_file_path);

        if (stat.isFile()) {
            if (/\.xml$/i.test(full_file_path)) {
                files_list.push(full_file_path);
            }
        }

    });

    return files_list;

};

export async function InfoGenerator (full_store_folder: string, full_reports_folder:string, project: string, logger: ILogger): Promise<IReportInfo> {

    const full_project_store_path = path.resolve(full_store_folder, project);
    const full_xml_store_path = path.resolve(full_project_store_path, "allure-results");
    const full_environment_file_path = path.resolve(full_project_store_path, "allure-results/environment.properties");
    const full_project_reports_path = path.resolve(full_reports_folder, project);
    const full_info_reports_path = path.resolve(full_project_reports_path, "info.json");

    logger.log(`[Reports] Generating info report for project ${chalk.grey(project)}`, "dev");

    const files = getXmlFilesList(full_xml_store_path);

    const tests_report: IReportInfo = {
        project: project,
        passed: true,
        passed_percent: 0,
        total_testes: 0,
        statuses: {},
        tests: {},
        env: {}
    };

    for (const file_path of files) {

        const body = await fs.promises.readFile(file_path);
        const body_json = await xml2js.parseStringPromise(body.toString());

        const suite_name = body_json["ns2:test-suite"].name[0];
        const test_cases = body_json["ns2:test-suite"]["test-cases"][0]["test-case"];

        for (const item of test_cases) {

            const test_name = item["name"][0];
            const full_name = `${suite_name}.${test_name}`;
            const start_time = item["$"]["start"];
            const stop_time = item["$"]["stop"];
            const test_status = item["$"]["status"];

            tests_report.total_testes += 1;

            if (tests_report.tests[full_name] === undefined) {
                tests_report.tests[full_name] = {
                    status: test_status,
                    start: start_time,
                    stop: stop_time
                };
            } else {
                if (tests_report.tests[full_name].start < start_time) {
                    tests_report.tests[full_name] = {
                        status: test_status,
                        start: start_time,
                        stop: stop_time
                    };
                }
            }

        }

    }

    for (const test_name in tests_report.tests) {

        const test_item = tests_report.tests[test_name];

        let failed_tests = 0;

        if (test_item.status !== "passed" && test_item.status !== "skipped") {
            failed_tests += 1;
        }
        
        if (tests_report.statuses[test_item.status] !== undefined) {
            tests_report.statuses[test_item.status] += 1;
        } else {
            tests_report.statuses[test_item.status] = 1;
        }

        if (failed_tests > 0) {
            tests_report.passed = false;
            tests_report.passed_percent = 100 - Math.round(failed_tests/tests_report.total_testes);
        } else {
            tests_report.passed = true;
            tests_report.passed_percent = 100;
        }

    }

    if (fs.existsSync(full_environment_file_path) === true) {

        const environment_body = await fs.promises.readFile(full_environment_file_path);
        const environment_list = environment_body.toString().split("\n");

        for (const item of environment_list) {

            if (/.+=.+/.test(item)) {

                const key = item.split("=")[0];
                const value = item.split("=")[1];

                tests_report.env[key] = value;

            }

        }

    }

    const info_dirname = path.dirname(full_info_reports_path);

    if (fs.existsSync(info_dirname) === false) {
        fs.promises.mkdir(info_dirname, {
            recursive: true
        });
    }

    await fs.promises.writeFile(full_info_reports_path, JSON.stringify(tests_report, null, 4));

    logger.log(`[Reports] Info report for project ${chalk.grey(project)} generated`, "dev");

    return tests_report;

}

