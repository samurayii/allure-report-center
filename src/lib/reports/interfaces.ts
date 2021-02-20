export interface IReportsConfig {
    store_folder: string
    http_folder: string
    backup_folder: string
    cron: {
        time_zone: string
        interval: string
    }
}

export interface IReports {
    close: () => void
    run: () => void
    addReport: (project: string, report: string, body: Buffer) => void
    existProject: (project: string) => boolean
    deleteProject: (project: string) => void
    existReport: (project: string, report: string) => boolean
    deleteReport: (project: string, report: string) => void
    getProjects: () => string[]
    getReports: (project: string) => Promise<string[]>
    getReport: (project: string, report: string) => Promise<string>
}

export interface IGenerator {
    run: (project: string) => Promise<IReportInfo>
}

export interface IReportInfo {
    project: string
    passed: boolean
    passed_percent: number
    total_testes: number
    url?: string
    statuses: {
        [key: string]: number
    }
    tests: {
        [key: string]: {
            status: string
            start: number
            stop: number
        }
    }
    env: {
        [key: string]: string
    }
}