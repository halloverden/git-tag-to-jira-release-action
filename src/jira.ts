import * as core from '@actions/core'
import JiraApi from 'jira-client'

export class Jira extends JiraApi {
  private jiraIdRegex = /((?<!([A-Za-z]{1,10})-?)[A-Z]+-\d+)/g

  constructor() {
    super({
      protocol: core.getInput('jira_protocol'),
      host: core.getInput('jira_host'),
      username: core.getInput('jira_username'),
      password: core.getInput('jira_password')
    })
  }

  async createVersionWithIssues(
    projectKey: string,
    name: string,
    issues: JiraApi.JsonResponse[]
  ): Promise<void> {
    const project = await this.getProject(projectKey)

    const version = await this.createVersion({
      name,
      description: `Version ${name}`,
      projectId: project.id
    })

    for (const issue of issues) {
      await this.updateIssue(issue.id, {
        update: {
          fixVersions: [{add: {name: version.name}}]
        }
      })
    }
  }

  /**
   * @param string
   * @param project
   */
  async findIssuesInString(
    string: string,
    project: string | null = null
  ): Promise<JiraApi.JsonResponse[]> {
    const issueIds = this.findPossibleIssueIdsInString(string)

    const issues = []
    for (const issueId of issueIds) {
      if (null !== project && project !== issueId.split('-', 1)[0]) {
        continue
      }

      try {
        issues.push(await this.findIssue(issueId))
      } catch (error) {
        // no-op
      }
    }

    return issues
  }

  /**
   * @param string
   * @private
   */
  private findPossibleIssueIdsInString(string: string): string[] {
    const matches = string.match(this.jiraIdRegex)

    if (!matches) {
      return []
    }

    return matches
  }
}
