import * as koa_body from "koa-body";
import { Middleware, IMiddleware } from "koa-ts-decorators";
import { IApiServerConfig } from "..";
import { ILogger, Logger } from "logger-flx";
import { Catalog } from "di-ts-decorators";
import * as chalk from "chalk";

@Middleware("api-server")
export class BodyParser implements IMiddleware {

    constructor (
        private readonly _app_id: string,
        private readonly _name: string,
        private readonly _logger: ILogger = <ILogger>Catalog(Logger)
    ) {
        this._logger.info(`[${this._app_id}] Middleware ${chalk.gray(this._name)} assigned to application`, "dev");
    }

    use (config: IApiServerConfig): unknown {

        const parsing_config = config.parsing;

        if (parsing_config.enable === false) {
            return;
        }

        return koa_body({
            jsonLimit: parsing_config.json_limit,
            formLimit: parsing_config.form_limit,
            textLimit: parsing_config.text_limit,
            encoding: parsing_config.encoding,
            multipart: parsing_config.multipart,
            urlencoded: parsing_config.urlencoded,
            text: parsing_config.text,
            json: parsing_config.json,
            jsonStrict: parsing_config.json_strict,
            includeUnparsed: parsing_config.include_unparsed,
            parsedMethods: parsing_config.methods
        });

    }
}