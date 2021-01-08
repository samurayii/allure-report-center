import Handlebars from "handlebars";
import { IReportInfo } from "../../reports";

Handlebars.registerHelper("if_eq", function(a, b, opts) {
    if (a == b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});

export function CommentGenerator (template: string, report_info: IReportInfo): string {
    const handlebars = Handlebars.compile(template);
    return handlebars(report_info);
}