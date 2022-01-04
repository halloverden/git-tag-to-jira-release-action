import * as core from '@actions/core'
import {ExecOutput, getExecOutput} from '@actions/exec'

/**
 * Find the tag message on the current commit
 */
export async function findTagMessage(tag: string): Promise<string | null> {
  const output = await getExecOutput('git', [
    'tag',
    '-l',
    '--format=%(contents)',
    tag
  ])
  debugOutput(output)

  if (!output.stdout) {
    return null
  }

  return output.stdout.replace(/\r?\n|\r/g, ' ').trim()
}

/**
 * Find the tag on current commit (HEAD)
 */
export async function findTag(): Promise<string | null> {
  const output = await getExecOutput('git', ['tag', '--points-at', 'HEAD'])
  debugOutput(output)

  const tags = output.stdout.split(/\r?\n|\r/)
  if (tags.length <= 1) {
    return null
  }

  return tags[tags.length - 2]
}

/**
 * @private
 * @param output
 */
function debugOutput(output: ExecOutput): void {
  core.debug(
    `strderr: ${output.stderr}, stdout: '${output.stdout}', exitCode: ${output.exitCode}`
  )
}
