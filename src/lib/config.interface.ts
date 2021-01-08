import { IApiServerConfig, IWebServerConfig } from "../http";
import { ILoggerConfig } from "logger-flx";
import { IAuthorizationConfig } from "./authorization";
import { IReportsConfig } from "./reports";
import { ITrackerConfig } from "./trackers";

export interface IAppConfig {
    logger: ILoggerConfig
    api: IApiServerConfig
    authorization: IAuthorizationConfig
    web: IWebServerConfig
    reports: IReportsConfig
    trackers: ITrackerConfig[]
}