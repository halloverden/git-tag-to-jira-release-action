<p align="center">
  <a href="https://github.com/halloverden/git-tag-to-jira-release-action/actions"><img alt="typescript-action status" src="https://github.com/halloverden/git-tag-to-jira-release-action/workflows/build-test/badge.svg"></a>
</p>

# Git tag to JIRA release action

Creates a JIRA release based on a git tag.

# How it works:

1. Finds the latest tag defined on HEAD
2. Finds all JIRA issue keys in the tag message
3. Creates a release with the tag as name and sets fixVersion on all the issues found to this version

# Example action

```yaml
name: create-jira-release

# Controls when the workflow will run
on:
  push:
    tags: 
      - "*"

jobs:
  create:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: Create JIRA release from git tag
        uses: halloverden/git-tag-to-jira-release-action@feature/initial-release
        with:
          jira_host: 'yourcompany.atlassian.net'
          jira_username: 'example@example.com'
          jira_password: '${{ secrets.JIRA_PASSWORD }}'
          jira_project: 'APP'

```
