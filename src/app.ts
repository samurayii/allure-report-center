#!/usr/bin/env node
import config from "./lib/entry";
import * as chalk from "chalk";
import { Logger } from "logger-flx";
import { Singleton } from "di-ts-decorators";
import { KoaD } from "koa-ts-decorators";
import { Authorization } from "./lib/authorization";

import "./http";
import { Reports } from "./lib/reports";
import { Trackers } from "./lib/trackers";

const logger = new Logger(config.logger);
const authorization = new Authorization(config.authorization);
const trackers = new Trackers(config.trackers, logger);
const reports = new Reports(config.reports, trackers, logger);

Singleton("config", config);
Singleton(Logger.name, logger);
Singleton(Reports.name, reports);

const api_server = new KoaD(config.api, "api-server");
const web_server = new KoaD(config.web, "web-server");

const bootstrap = async () => {

    try {

        api_server.context.authorization = authorization;
        web_server.context.authorization = authorization;

        reports.run();

        await api_server.listen( () => {
            logger.info(`[api-server] listening on network interface ${chalk.gray(`${api_server.config.listening}${api_server.prefix}`)}`);
        });
        
        await web_server.listen( () => {
            logger.info(`[web-server] listening on network interface ${chalk.gray(`${web_server.config.listening}${web_server.prefix}`)}`);
        });

    } catch (error) {
        logger.error(error.message);
        logger.log(error.stack);
        process.exit(1);
    }

};

bootstrap();

process.on("SIGTERM", () => {
    logger.log("Termination signal received");
    process.exit();
});