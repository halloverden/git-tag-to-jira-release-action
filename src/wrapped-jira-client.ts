import { JiraApi, JiraApiOptions } from 'ts-jira-client';
import * as core from '@actions/core';
import { JiraIssue, JiraProject } from 'ts-jira-client/lib/custom';
import { components } from 'ts-jira-client/lib/generated/openapi-cloud';
import { AxiosError } from 'axios';

type JiraProjectVersion = components['schemas']['Version'];

type JiraErrorResponse = {
  errorMessages?: string[];
  errors?: { [key: string]: string };
};

export class WrappedJiraClient {
  private jiraApi: JiraApi;
  private jiraIdRegex = /((?<!([A-Za-z]{1,10})-?)[A-Z]+-\d+)/g;

  constructor(
    private readonly options: {
      jira: JiraApiOptions;
    }
  ) {
    this.jiraApi = new JiraApi(options.jira);
  }

  async createVersionWithIssues(
    projectKey: string,
    name: string,
    issues: JiraIssue[]
  ): Promise<void> {
    let project: JiraProject | null = null;

    try {
      project = (await this.jiraApi.getProject(projectKey)) as JiraProject;
    } catch (e) {
      if (e instanceof AxiosError) {
        core.error(`Couldn't find project`);
        const errors = this.extractJiraErrors(e);
        errors.forEach(err => {
          core.error(err);
        });
      } else {
        core.error(`Couldn't find project ${JSON.stringify(e)}`);
      }
      throw e;
    }

    core.debug(
      `Found project '${project.name}' matching project key '${projectKey}'`
    );

    let version: JiraProjectVersion | null = null;

    try {
      core.debug(
        `Attempting to create version (name: ${name}, projectId: ${project.id})`
      );

      version = await this.jiraApi.createVersion({
        name,
        description: `Version ${name}`,
        projectId: parseInt(project.id, 10)
      });
    } catch (e) {
      if (e instanceof AxiosError) {
        core.error(`Couldn't create version`);
        const errors = this.extractJiraErrors(e);
        errors.forEach(err => {
          core.error(err);
        });
      } else {
        core.error(`Couldn't create version ${JSON.stringify(e)}`);
      }
      throw e;
    }

    core.debug(`Created version: ${version.name}`);

    for (const issue of issues) {
      try {
        await this.jiraApi.updateIssue(issue.id, {
          update: {
            fixVersions: [{ add: { name: version.name } }]
          }
        });
      } catch (e) {
        if (e instanceof AxiosError) {
          core.warning(`Couldn't update issue '${issue.id}'`);
          const errors = this.extractJiraErrors(e);
          errors.forEach(err => {
            core.warning(err);
          });
        } else {
          core.warning(
            `Couldn't update issue '${issue.id}' ${JSON.stringify(e)}`
          );
        }
      }
    }
  }

  /**
   * @param string
   * @param project
   */
  async findIssuesInString(
    string: string,
    project: string | null = null
  ): Promise<JiraIssue[]> {
    const issueIds = this.findPossibleIssueIdsInString(string);

    const issues: JiraIssue[] = [];
    for (const issueId of issueIds) {
      if (null !== project && project !== issueId.split('-', 1)[0]) {
        core.debug(
          `Found issue '${issueId}', but project did not match settings (${project})`
        );
        continue;
      }

      try {
        issues.push((await this.jiraApi.findIssue(issueId)) as JiraIssue);
      } catch (e) {
        if (e instanceof AxiosError) {
          core.warning(`Couldn't find issue '${issueId}'`);
          const errors = this.extractJiraErrors(e);
          errors.forEach(err => {
            core.warning(err);
          });
        } else {
          core.warning(
            `Couldn't find issue '${issueId}': ${JSON.stringify(e)}`
          );
        }
      }
    }

    return issues;
  }

  /**
   * @param string
   * @private
   */
  private findPossibleIssueIdsInString(string: string): string[] {
    const matches = string.match(this.jiraIdRegex);

    if (!matches) {
      return [];
    }

    return matches;
  }

  private extractJiraErrors(response: AxiosError): string[] {
    const r: string[] = [];

    const data = response.response?.data;

    if (!this.isJiraErrorResponse(data)) {
      return r;
    }

    if (data.errorMessages) {
      data.errorMessages.forEach((m: string) => {
        r.push(m);
      });
    }
    if (data.errors) {
      Object.entries(data.errors).forEach((value: [string, string]) => {
        r.push(`Jira API said '${value[0]}: ${value[1]}'`);
      });
    }

    return r;
  }

  private isJiraErrorResponse(data: any): data is JiraErrorResponse {
    if (!data) {
      return false;
    }

    if (data.errorMessages && Array.isArray(data.errorMessages)) {
      return true;
    }

    return !!(data.errors && Array.isArray(data.errors));
  }
}
