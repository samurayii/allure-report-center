export interface IReportsConfig {
    store_folder: string
    http_folder: string
    cron: {
        time_zone: string
        interval: string
    }
}

export interface IReports {
    close: () => void
    run: () => void
    addReport: (project: string, report: string, body: string) => void
    existProject: (project: string) => boolean
    deleteProject: (project: string) => void
    existReport: (project: string, report: string) => boolean
    deleteReport: (project: string, report: string) => void
    getProjects: () => string[]
    getReports: (project: string) => Promise<string[]>
    getReport: (project: string, report: string) => Promise<string>
}

export interface IGenerator {
    run: (project: string) => void
}