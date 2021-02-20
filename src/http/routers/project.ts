import { Catalog } from "di-ts-decorators";
import { Context, Controller, Delete, Get, Post } from "koa-ts-decorators";
import { ILogger, Logger } from "logger-flx";
import { IReports, Reports } from "../../lib/reports";
import * as chalk from "chalk";

@Controller("/v1/project", "api-server")
export class RouteProject {

    constructor (
        private readonly _app_id: string,
        private readonly _name: string,
        private readonly _prefix: string,
        private readonly _logger: ILogger = <ILogger>Catalog(Logger),
        private readonly _projects: IReports = <IReports>Catalog(Reports)
    )  {
        this._logger.info(`[${this._app_id}] Controller ${chalk.gray(this._name)} assigned to application with prefix ${chalk.gray(this._prefix)}`, "dev");
    }

    @Get("/:name/exist", "api-server")
    async exist_project (ctx: Context): Promise<void> {

        const name = ctx.params.name;
        const list = this._projects.getProjects();

        ctx.body = { 
            status: "success",
            data: list.includes(name)
        };
        
        ctx.status = 200;
    
    }

    @Delete("/:name", "api-server")
    async delete_project (ctx: Context): Promise<void> {

        const name = ctx.params.name;
        const list = this._projects.getProjects();
        

        if (list.includes(name) === false) {
            ctx.body = { 
                status: "fail",
                message: `Project named "${name}" not found`
            };
        } else {

            this._projects.deleteProject(name);

            ctx.body = { 
                status: "success",
                message: `Project named "${name}" deleted`
            };

        }

        ctx.status = 200;
    
    }

    @Get("/:name/reports", "api-server")
    async list_reports (ctx: Context): Promise<void> {

        const name = ctx.params.name;
        const list = await this._projects.getReports(name);

        if (list === undefined) {
            ctx.body = { 
                status: "fail",
                message: `Project named "${name}" not found`
            };
        } else {
            ctx.body = { 
                status: "success",
                data: list
            };
        }
        
        ctx.status = 200;
    
    }

    @Get("/:name/report/:report", "api-server")
    async get_reports (ctx: Context): Promise<void> {

        const name = ctx.params.name;
        const report = ctx.params.report;
        const list = this._projects.getProjects();

        if (list.includes(name) === false) {
            ctx.body = { 
                status: "fail",
                message: `Project named "${name}" not found`
            };
        } else {

            const result = await this._projects.getReport(name, report);

            if (result === undefined) {
                ctx.body = { 
                    status: "fail",
                    message: `Report named "${report}" for project "${name}" not found`
                };
            } else {
                ctx.body = { 
                    status: "success",
                    data: result
                };
            }
        }

        ctx.status = 200;
    
    }

    @Post("/:name/report/:report", "api-server")
    async post_reports (ctx: Context): Promise<void> {

        if (ctx.request.body === undefined) {
            throw new Error("Request body empty");
        }

        const name = ctx.params.name;
        const report = ctx.params.report;
        const body = ctx.request.body;

        this._projects.addReport(name, report, Buffer.from(body, "base64"));

        ctx.body = { 
            status: "success",
            message: `Report "${report}" added to "${name}" project`
        };

        ctx.status = 200;

    }

    @Get("/:name/report/:report/exist", "api-server")
    async exist_reports (ctx: Context): Promise<void> {

        const name = ctx.params.name;
        const report = ctx.params.report;
        const list = this._projects.getProjects();

        if (list.includes(name) === false) {
            ctx.body = { 
                status: "fail",
                message: `Project named "${name}" not found`
            };
        } else {
            ctx.body = { 
                status: "success",
                data: this._projects.existReport(name, report)
            };
        }

        ctx.status = 200;
    
    }

    @Delete("/:name/report/:report", "api-server")
    async delete_reports (ctx: Context): Promise<void> {

        const name = ctx.params.name;
        const report = ctx.params.report;
        const list = this._projects.getProjects();
        

        if (list.includes(name) === false) {
            ctx.body = { 
                status: "fail",
                message: `Project named "${name}" not found`
            };
        } else {

            this._projects.deleteReport(name, report);

            ctx.body = { 
                status: "success",
                message: `Report named "${report}" for project "${name}" deleted`
            };

        }

        ctx.status = 200;
    
    }

}