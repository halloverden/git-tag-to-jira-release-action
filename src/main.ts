import * as core from '@actions/core'
import * as gitUtils from './git-utils'
import {Jira} from './jira'
import JiraApi from 'jira-client'

async function run(): Promise<void> {
  try {
    const tag = await gitUtils.findTag()
    if (null === tag) {
      core.debug('No tag found')
      return
    }
    core.debug(`Tag: ${tag}`)

    const tagMessage = await gitUtils.findTagMessage(tag)
    core.debug(`Tag message: '${tagMessage}'`)

    const jira = new Jira()

    let issues: JiraApi.JsonResponse[] = []
    if (null !== tagMessage) {
      issues = await jira.findIssuesInString(tagMessage)
    }

    await jira.createVersionWithIssues(
      core.getInput('jira_project'),
      tag,
      issues
    )
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      throw error
    }
  }
}

run()
