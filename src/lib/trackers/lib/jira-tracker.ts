import { IJiraFilters, ITracker, ITrackerConfig } from "../interfaces";
import { ILogger } from "logger-flx";
import * as chalk from "chalk";
import { IReportInfo } from "../../reports";
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";
import { JqlGenerator } from "./jql-generator";
import { CommentGenerator } from "./comment-generator";

type TJsonIssueInfo = {
    key: string
    self: string
    fields: {
        project: {
            key: string
        }
    }
}

type TJsonResponseIssues = {
    startAt: number
    maxResults: number
    total: number
    issues: TJsonIssueInfo[]
}

type TJsonFieldInfo = {
    id: string
    name: string
}

type TJsonResponseFields = {
    maxResults: number
    startAt: number
    total: number
    isLast: boolean
    values: TJsonFieldInfo[]
}

type TPutFieldsBody = {
    fields: {
        [key: string]: string
    }
}

export class JiraTracker implements ITracker {

    private readonly _url: string
    private readonly _auth: string
    private readonly _comment_template: string

    constructor (
        private readonly _config: ITrackerConfig,
        private readonly _logger: ILogger
    ) {

        this._url = `${this._config.url.replace(/\:\/\/.+\:.+@/i, "://").replace(/\/$/i, "")}/rest/api/2`;
        this._auth = "";
        this._comment_template = "";

        if (this._config.password !== undefined && this._config.user !== undefined) {
            this._auth = `Basic ${Buffer.from(`${this._config.user.trim()}:${this._config.password.trim()}`).toString("base64")}`;
        }

        if (this._config.comment.enable === true) {

            const full_template_path = path.resolve(process.cwd(), this._config.comment.template);

            if (fs.existsSync(full_template_path) === false) {
                this._logger.error(`[Trackers] Template file ${chalk.grey(full_template_path)} not found`);
                process.exit(1);
            }
    
            this._comment_template = fs.readFileSync(full_template_path).toString();

        }

        if (this._config.enable === true) {
            this._logger.log(`[Trackers] Tracker ${chalk.grey(this._config.url.replace(/\:\/\/.+\:.+@/i, "://").replace(/\/$/i, ""))} of type ${chalk.gray("JIRA")} ${chalk.green("activated")}`, "dev");
        }

    }

    run (report_info: IReportInfo): void {

        if (this._config.enable === false) {
            return;
        }

        const jira_filters: IJiraFilters = {};

        for (const key in report_info.env) {

            if (/^JIRA_/i.test(key)) {

                const filter_key = key.replace(/^JIRA_/, "").toLocaleLowerCase();
                const value = report_info.env[key].split(",");

                jira_filters[filter_key] = value;

            }

        }

        if (Object.keys(jira_filters).length <= 0) {
            return;
        }

        this._sendToServer(report_info, jira_filters);

    }

    async _sendToServer (report_info: IReportInfo, jira_filters: IJiraFilters): Promise<void> {

        const ping_url = `${this._url}/myself`;

        this._logger.log(`[Trackers] GET ${chalk.grey(ping_url)}`, "dev");

        const ping_response = await fetch(ping_url, {
            method: "GET",
            headers: {
                "Authorization": this._auth,
                "Accept": "application/json"
            }
        });

        if (ping_response.status !== 200) {
            this._logger.error(`[Trackers] Server JIRA ${chalk.grey(this._url)}, request ${chalk.grey(ping_url)} return code ${chalk.red(ping_response.status)}. error: ${await ping_response.text()}`);
            return;
        }
        
        const issues_list: TJsonIssueInfo[] = await this._getIssues(jira_filters);

        if (this._config.comment.enable === true) {
            await this._addComment(report_info, issues_list);
        }

        if (this._config.fields.enable === true) {
            await this._addFields(report_info, issues_list);
        }

    }

    async _getIssues (jira_filters: IJiraFilters, start: number = 0): Promise<TJsonIssueInfo[]> {

        const issue_url = `${this._url}/search`;

        this._logger.log(`[Trackers] POST ${chalk.grey(issue_url)}`, "dev");

        const issue_response = await fetch(issue_url, {
            method: "POST",
            headers: {
                "Authorization": this._auth,
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                expand: [],
                jql: JqlGenerator(jira_filters),
                maxResults: 10,
                validateQuery: false,
                fields: [
                  "status",
                  "project"
                ],
                startAt: start
            })
        });

        if (issue_response.status !== 200) {
            this._logger.error(`[Trackers] Server JIRA ${chalk.grey(this._url)}, request ${chalk.grey(issue_url)} return code ${chalk.red(issue_response.status)}. error: ${await issue_response.text()}`);
            return [];
        }

        const response_json: TJsonResponseIssues = await issue_response.json();

        if ((response_json.maxResults + response_json.startAt) >= response_json.total) {
            return response_json.issues;
        }

        const new_start = response_json.maxResults + response_json.startAt;

        const issues_list: TJsonIssueInfo[] = await this._getIssues(jira_filters, new_start);

        return issues_list.concat(response_json.issues);

    }

    async _addComment (report_info: IReportInfo, issues_list: TJsonIssueInfo[]): Promise<void> {

        report_info.url = `${this._config.report_link.replace(/\/$/, "")}/${report_info.project}/index.html`;

        for (const item of issues_list) {

            const comment_url = `${this._url}/issue/${item.key}/comment`;

            this._logger.log(`[Trackers] POST ${chalk.grey(comment_url)}`, "dev");

            const comment_response = await fetch(comment_url, {
                method: "POST",
                headers: {
                    "Authorization": this._auth,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    body: CommentGenerator(this._comment_template, report_info)
                })
            });

            if (comment_response.status !== 201) {
                this._logger.error(`[Trackers] Server JIRA ${chalk.grey(this._url)}, request ${chalk.grey(comment_url)} return code ${chalk.red(comment_response.status)}. error: ${await comment_response.text()}`);
                return;
            }

        }

    }

    async _getFields (start: number = 1): Promise<TJsonFieldInfo[]> {

        const fields_url = `${this._url}/customFields?startAt=${start}`;

        this._logger.log(`[Trackers] GET ${chalk.grey(fields_url)}`, "dev");

        const fields_response = await fetch(fields_url, {
            method: "GET",
            headers: {
                "Authorization": this._auth,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });

        if (fields_response.status !== 200) {
            this._logger.error(`[Trackers] Server JIRA ${chalk.grey(this._url)}, request ${chalk.grey(fields_url)} return code ${chalk.red(fields_response.status)}. error: ${await fields_response.text()}`);
            return [];
        }

        const response_json: TJsonResponseFields = await fields_response.json();

        if (response_json.isLast === true) {
            return response_json.values;
        }

        const new_start = start + 1;

        const fields_list: TJsonFieldInfo[] = await this._getFields(new_start);

        return fields_list.concat(response_json.values);

    }

    async _addFields (report_info: IReportInfo, issues_list: TJsonIssueInfo[]): Promise<void> {

        const fields_list = await this._getFields();

        let id_report_field; 
        let id_status_field;

        for (const item of fields_list) {

            if (item.name === this._config.fields.status.name) {
                id_status_field = item.id;
                this._logger.log(`[Trackers] Status field named ${chalk.grey(this._config.fields.status.name)} to JIRA ${chalk.grey(this._url)} exist`, "dev");
            }

            if (item.name === this._config.fields.report_link.name) {
                id_report_field = item.id;
                this._logger.log(`[Trackers] Report field named ${chalk.grey(this._config.fields.report_link.name)} to JIRA ${chalk.grey(this._url)} exist`, "dev");
            }

        }

        if (id_status_field === undefined && this._config.fields.status.enable === true) {

            const field_url = `${this._url}/field`;

            this._logger.log(`[Trackers] Add status field named ${chalk.grey(this._config.fields.status.name)} to JIRA ${chalk.grey(this._url)}`, "dev");
            this._logger.log(`[Trackers] POST ${chalk.grey(field_url)}`, "dev");

            const response = await fetch(field_url, {
                method: "POST",
                headers: {
                    "Authorization": this._auth,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: this._config.fields.status.name,
                    description: "Status of testing",
                    type: "com.atlassian.jira.plugin.system.customfieldtypes:textfield",
                    searcherKey: "com.atlassian.jira.plugin.system.customfieldtypes:textsearcher"
                })
            });

            if (response.status !== 201) {
                this._logger.error(`[Trackers] Server JIRA ${chalk.grey(this._url)}, request ${chalk.grey(field_url)} return code ${chalk.red(response.status)}. error: ${await response.text()}`);
                return;
            }

            const json_body = await response.json();
            
            id_status_field = json_body.id;

            this._logger.log(`[Trackers] Status field named ${chalk.grey(this._config.fields.status.name)} to JIRA ${chalk.grey(this._url)} added`, "dev");

        }
        
        if (id_report_field === undefined && this._config.fields.report_link.enable === true) {

            const field_url = `${this._url}/field`;

            this._logger.log(`[Trackers] Add report field named ${chalk.grey(this._config.fields.report_link.name)} to JIRA ${chalk.grey(this._url)}`, "dev");
            this._logger.log(`[Trackers] POST ${chalk.grey(field_url)}`, "dev");

            const response = await fetch(field_url, {
                method: "POST",
                headers: {
                    "Authorization": this._auth,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: this._config.fields.report_link.name,
                    description: "Link to allure report",
                    type: "com.atlassian.jira.plugin.system.customfieldtypes:url",
                    searcherKey: "com.atlassian.jira.plugin.system.customfieldtypes:exacttextsearcher"
                })
            });

            if (response.status !== 201) {
                this._logger.error(`[Trackers] Server JIRA ${chalk.grey(this._url)}, request ${chalk.grey(field_url)} return code ${chalk.red(response.status)}. error: ${await response.text()}`);
                return;
            }

            const json_body = await response.json();
            
            id_report_field = json_body.id;

            this._logger.log(`[Trackers] Report field named ${chalk.grey(this._config.fields.report_link.name)} to JIRA ${chalk.grey(this._url)} added`, "dev");

        }

        if (this._config.fields.report_link.enable === false && this._config.fields.status.enable === false) {
            return;
        }

        for (const item of issues_list) {

            const issue_url = `${this._url}/issue/${item.key}`;

            this._logger.log(`[Trackers] PUT ${chalk.grey(issue_url)}`, "dev");

            const body: TPutFieldsBody = {
                fields: {}
            };

            if (this._config.fields.report_link.enable === true) {
                body.fields[id_report_field] = report_info.url;
            }

            if (this._config.fields.status.enable === true) {
                if (report_info.passed === true) {
                    body.fields[id_status_field] = `passed (${report_info.passed_percent}%)`;
                } else {
                    body.fields[id_status_field] = `failed (${report_info.passed_percent}%)`;
                }
            }

            await fetch(issue_url, {
                method: "PUT",
                headers: {
                    "Authorization": this._auth,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

        }

    }

}