import { ITracker, ITrackerConfig, ITrackers } from "./interfaces";
import { ILogger } from "logger-flx";
import * as chalk from "chalk";
import { IReportInfo } from "../reports";
import { JiraTracker } from "./lib/jira-tracker";

export * from "./interfaces";

export class Trackers implements ITrackers {

    private readonly _trackers: ITracker[]

    constructor (
        tracker_list: ITrackerConfig[],
        private readonly _logger: ILogger
    ) {

        this._trackers = [];

        for (const item of tracker_list) {

            if (item.type === "jira") {
                this._trackers.push(new JiraTracker(item, this._logger));
                continue;
            }

            this._logger.error(`${chalk.red("[ERROR]")} Tracker type ${chalk.gray(item.type)} not support`);
            process.exit(1);

        }

    }

    run (report_info: IReportInfo): void {
        for (const tracker of this._trackers) {
            tracker.run(report_info);
        }
    }

}