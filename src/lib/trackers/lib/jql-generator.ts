import { IJiraFilters } from "../interfaces";
import Handlebars from "handlebars";

Handlebars.registerHelper("if_eq", function(a, b, opts) {
    if (a == b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});

Handlebars.registerHelper("group", (key: string, separator: string, list: string[]) => {

    if (Array.isArray(list) === false) {
        return "";
    }

    let i = 0;
    let result = "";
    
    for (const item of list) {

        if (i === 0) {
            result += `${key} = '${item}'`;
        }

        if (i > 0) {
            result += `${separator}${key} = '${item}'`;
        }

        i++;

    }

    return result;

});

const template = `
{{#if project}}
    {{#if_eq project.length 1}}
        project = '{{project}}'
    {{else}}
        ({{{group 'project' ' OR ' project}}})
    {{/if_eq}}
{{/if}}
{{#if status}}
    AND 
    {{#if_eq status.length 1}}
        status = '{{status}}'
    {{else}}
        ({{{group 'status' ' OR ' status}}})
    {{/if_eq}}
{{/if}}
{{#if task_id}}
    AND 
    {{#if_eq task_id.length 1}}
        issue = '{{task_id}}'
    {{else}}
        ({{{group 'issue' ' OR ' task_id}}})
    {{/if_eq}}
{{/if}}
{{#if task_label}}
    AND 
    {{#if_eq task_label.length 1}}
        labels = '{{task_label}}'
    {{else}}
        ({{{group 'labels' ' OR ' task_label}}})
    {{/if_eq}}
{{/if}}
`;

const handlebars = Handlebars.compile(template);

export function JqlGenerator (jira_filters: IJiraFilters): string {
    return handlebars(jira_filters).replace(/[\r\n]+/g, "").trim().replace(/\x20+/g, " ");
}