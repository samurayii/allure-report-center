import { IReportInfo } from "../reports";

export interface ITrackerConfig {
    type: string
    enable: boolean
    url: string
    user?:string
    password?:string
    report_link?: string
    comment?: {
        enable: boolean
        template: string
    }
    fields?: {
        enable: boolean
        status: {
            enable: boolean
            name: string
        }
        last_report: {
            enable: boolean
            name: string
        }
    }
    
}

export interface ITracker {
    run: (report: IReportInfo) => void
}

export interface ITrackers {
    run: (report: IReportInfo) => void
}

export interface IJiraFilters {
    [key: string]: string[]
}