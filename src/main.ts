import * as core from '@actions/core';
import * as gitUtils from './git-utils';
import { WrappedJiraClient } from './wrapped-jira-client';
import { JiraIssue } from 'ts-jira-client/lib/custom';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const validateJiraApiVersion = (version: number): version is 1 | 2 | 3 => {
    return [1, 2, 3].includes(version);
  };

  try {
    const tag = await gitUtils.findTag();
    if (null === tag) {
      core.debug('No tag found');
      return;
    }
    core.debug(`Tag: ${tag}`);

    const tagMessage = await gitUtils.findTagMessage(tag);
    core.debug(`Tag message: '${tagMessage}'`);

    let jiraApiVersion: 1 | 2 | 3 = 3;
    const c = parseInt(core.getInput('jira_api_version'), 10);
    if (validateJiraApiVersion(c)) {
      jiraApiVersion = c;
    }

    const wrappedJiraClient = new WrappedJiraClient({
      jira: {
        protocol: 'https',
        host: core.getInput('jira_host'),
        username: core.getInput('jira_username'),
        password: core.getInput('jira_password'),
        apiVersion: jiraApiVersion
      }
    });

    let issues: JiraIssue[] = [];
    if (null !== tagMessage) {
      issues = await wrappedJiraClient.findIssuesInString(tagMessage);
    }

    core.debug(`Found ${issues.length} issue${issues.length ? '' : 's'}`);

    await wrappedJiraClient.createVersionWithIssues(
      core.getInput('jira_project'),
      tag,
      issues
    );
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.debug(`Error was thrown: ${error}`);
      throw error;
    }
  }
}
