import * as static_server from "koa-static";
import { resolve } from "path";
import { existsSync } from "fs";
import { Middleware, IMiddleware } from "koa-ts-decorators";
import { ILogger, Logger } from "logger-flx";
import { Catalog } from "di-ts-decorators";
import { IWebServerConfig } from "../interfaces";
import * as chalk from "chalk";

@Middleware("web-server")
export class Static implements IMiddleware {

    constructor (
        private readonly _app_id: string,
        private readonly _name: string,
        private readonly _logger: ILogger = <ILogger>Catalog(Logger)
    ) {
        this._logger.info(`[${this._app_id}] Middleware ${chalk.gray(this._name)} assigned to application`, "dev");
    }

    use (config: IWebServerConfig ): unknown {
        
        const root_folder = resolve(process.cwd(), config.static.folder);

        if (!existsSync(root_folder)) {
            this._logger.error(`[${this._app_id}] Static folder ${root_folder} not found`);
            process.exit(1);
        }

        return static_server(root_folder, {
            maxage: config.static.maxage,
            hidden: config.static.hidden,
            index: config.static.index,
            defer: config.static.defer,
            gzip: config.static.gzip,
            brotli: config.static.brotli
        });

    }
}