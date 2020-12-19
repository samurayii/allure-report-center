import { ILogger, Logger } from "logger-flx";
import { Middleware, IMiddleware, Context, Next } from "koa-ts-decorators";
import { Catalog } from "di-ts-decorators";
import { IApiServerConfig } from "../interfaces";
import * as chalk from "chalk";

@Middleware("api-server")
export class Healthcheck implements IMiddleware {

    private readonly _start_time: number

    constructor (
        private readonly _app_id: string,
        private readonly _name: string,
        private readonly _logger: ILogger = <ILogger>Catalog(Logger)
    ) {
        this._logger.info(`[${this._app_id}] Middleware ${chalk.gray(this._name)} assigned to application`, "dev");
        this._start_time = (new Date()).getTime();
    }

    _getTextTime (time: number): string {

        let text = "";

        const days: number = Math.floor(time/86400);

        time = time - (days*86400);

        const hours: number = Math.floor(time/3600);

        time = time - (hours*3600);

        const minutes: number = Math.floor(time/60);

        time = time - (minutes*60);

        const seconds: number = Math.floor(time);

        if (days > 0) {
            text = `${text}${days}d`;
        }
        if (hours > 0) {
            text = `${text}${hours}h`;
        }
        if (minutes > 0) {
            text = `${text}${minutes}m`;
        }
        if (seconds > 0) {
            text = `${text}${seconds}s`;
        }

        return text;
    }

    use (config: IApiServerConfig): unknown {

        return (ctx: Context, next: Next) => {

            if (ctx.url === "/_ping") {
                ctx.body = "pong 🎾";
                ctx.status = 200;
                return;
            }

            if (ctx.url === "/healthcheck/status") {
                ctx.body = {
                    healthy: true,
                    work_time: Math.floor((Date.now() - this._start_time)/1000),
                    human_work_time: this._getTextTime(Math.floor((Date.now() - this._start_time)/1000))
                };
                ctx.status = 200;
                return;
            }

            if (!ctx.url.includes(`${config.prefix}/healthcheck`) && ctx.url !== `${config.prefix}` && ctx.url !== `${config.prefix}/` && ctx.url !== "/healthcheck") {
                return next();
            } else {
                ctx.body = "Healthy";
                ctx.status = 200;
                return;
            }

        };

    }

}
