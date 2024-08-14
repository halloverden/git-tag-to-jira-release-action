# Git tag to Jira release action

[![GitHub Super-Linter](https://github.com/halloverden/git-tag-to-jira-release-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/halloverden/git-tag-to-jira-release-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/halloverden/git-tag-to-jira-release-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/halloverden/git-tag-to-jira-release-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/halloverden/git-tag-to-jira-release-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/halloverden/git-tag-to-jira-release-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

Creates a Jira release based on a Git tag.

## How it works

1. Finds the latest tag defined on HEAD
2. Finds all Jira issue keys in the tag message
3. Creates a release with the tag as name and sets fixVersion on all the issues
   found to this version

## Example action

```yaml
name: create-jira-release

# Controls when the workflow will run
on:
  push:
    tags:
      - '*'

jobs:
  create:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: Create Jira release from git tag
        uses: halloverden/git-tag-to-jira-release-action@v1
        with:
          jira_host: 'yourcompany.atlassian.net'
          jira_username: 'example@example.com'
          jira_password: '${{ secrets.JIRA_PASSWORD }}'
          jira_project: 'APP'
```
