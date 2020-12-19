import { ILogger, Logger } from "logger-flx";
import { Middleware, IMiddleware, Context, Next } from "koa-ts-decorators";
import { Catalog } from "di-ts-decorators";
import { IApiServerConfig } from "../interfaces";
import * as chalk from "chalk";

@Middleware("api-server")
export class Authorization implements IMiddleware {

    constructor (
        private readonly _app_id: string,
        private readonly _name: string,
        private readonly _logger: ILogger = <ILogger>Catalog(Logger)
    ) {
        this._logger.info(`[${this._app_id}] Middleware ${chalk.gray(this._name)} assigned to application`, "dev");
    }

    use ( config: IApiServerConfig ): unknown {

        if (config.auth === false) {

            this._logger.info(`[${this._app_id}] Authorization disabled`, "dev");

            return (ctx: Context, next: Next) => {
                return next();
            };

        } else {

            this._logger.info(`[${this._app_id}] Authorization enabled`, "dev");

            return async (ctx: Context, next: Next) => {
                

                const authorization = ctx.header["authorization"];

                if (authorization === undefined) {
                    ctx.status = 401;
                    ctx.set("WWW-Authenticate", "Basic");
                    return;
                }

                let access_flag = false;

                if (authorization.includes("Basic ")) {

                    const authorization_string = authorization.replace("Basic ", "").trim();
                    const authorization_utf8 = (Buffer.from(authorization_string, "base64")).toString("utf8");
    
                    const username = authorization_utf8.split(":")[0];
                    const password = authorization_utf8.split(":")[1];
                    
                    access_flag = await ctx.authorization.checkPassword(username, password);

                }

                if (authorization.includes("Bearer ")) {
                    const authorization_string = authorization.replace("Bearer ", "").trim();
                    access_flag = await ctx.authorization.checkToken(authorization_string);
                }

                if (access_flag === false) {
                    ctx.status = 403;
                    return;
                }

                return next();

            };
        }

    }
}