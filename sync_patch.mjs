async function main() {
  const repoConfigs = require('./repos.json')
  const { repos, patch } = repoConfigs
  for (const repo of repos) {
    await executeSync(repo, patch)
  }
}

async function executeSync(repo, patch) {
  cd(process.cwd())
  await $`pwd`
  await cloneRepo(repo)
    
  try {
    cd(getLocaleRepoName(repo))
    await checkUntrackedFiles(repo)
    await syncBranch(repo)
    await syncPatch(repo, patch)
    await openIDE(repo)
  } catch (err) {}
}

async function cloneRepo(repo) {
  const repoUrl = getRepoUrl(repo)
  const repoDir = path.join(process.cwd(), getLocaleRepoName(repo))

  if (fs.existsSync(repoDir)) {
    warn(`${getLocaleRepoName(repo)} 已经存在，不需要重复clone`)
  } else {
    log(`开始clone ${repoUrl}`)
    await $`git clone ${repoUrl} ${getLocaleRepoName(repo)}`
  }
}

async function syncBranch(repo) {
  try {
    await $`git switch ${getOriginBranchName(repo)}`
    const isSync = await question(ques(`${getLocaleRepoName(repo)} 已切换至分支 ${getOriginBranchName(repo)}，是否需要同步最新代码？(y/n)`), { choices: ['y', 'n'] })
  
    if (isSync === 'y') {
      await syncOriginBranch(repo)
    }

    await switchToTargetBranch(repo)
  } catch (err) {
    // log(`${getLocaleRepoName(repo)} 不存在分支 ${repo.targetBranchName}，正在创建分支...`)
    // await $`git checkout -b ${repo.targetBranchName}`
  }
}

async function syncOriginBranch(repo) {
  try {
    log(`开始同步 ${getLocaleRepoName(repo)}`)
    await $`git pull`
    success(`${getLocaleRepoName(repo)} 同步完成`)
  } catch (err) {
    log(`正在和远程分支建立连接...`)
    await nothrow($`git branch --set-upstream-to=origin/${getOriginBranchName(repo)} ${getOriginBranchName(repo)}`)
  }
}

async function switchToTargetBranch(repo) {
  if (!repo.targetBranchName) return
  try {
    log(`基于当前分支（${getOriginBranchName(repo)}）开始切换分支到 (${repo.targetBranchName})`)
  
    await $`git switch ${repo.targetBranchName}`
  } catch (err) {
    log(`${getLocaleRepoName(repo)} 不存在分支 ${repo.targetBranchName}，正在创建目标分支...`)
    await $`git checkout -b ${repo.targetBranchName}`
  }
}

async function checkUntrackedFiles(repo) {
  const isCleanly = await $`git diff --exit-code && git diff --cached --exit-code`.exitCode === 0

  if (!isCleanly) {
    await nothrow($`git checkout -- *.rej`)
    warn(`${getLocaleRepoName(repo)} 有未提交的文件，准备为您暂存`)
    await $`git stash save`
    success(`${getLocaleRepoName(repo)} 暂存完成`)
  }
}

async function syncPatch(repo, patch) {
  try {
    const files = await glob(patch)
    const isSkipCheck = await question(ques('是否跳过补丁检查?(y/n)'), { choices: ['y', 'n'] })
    
    for (const file of files) {
      const correctFilePath = path.relative(getLocaleRepoName(repo), file)
      if (isSkipCheck === 'n') {
        await $`git apply --stat ${correctFilePath}`
        await $`git apply --check ${correctFilePath}`
      } else {
        warn('Skipped patch checking')
      }
      await applyPatch(correctFilePath)
    }

    success('完成补丁，请进入对应主题文件夹查看结果!')
  } catch (err) {
    error(err)
  }
}

async function applyPatch(correctFilePath) {
  try {
    log('正在应用补丁...')
    await $`git apply --3way ${correctFilePath}`
  } catch (err) {
    warn(`应用补丁失败，请手动应用：${correctFilePath}`)
    await $`git apply --reject ${correctFilePath}`
  }
}

async function openIDE(repo) {
  const isOpenWithVscode = await question(ques('是否使用VSCode打开IDE?(y/n)'), { choices: ['y', 'n'] })

  if (isOpenWithVscode === 'y') {
    log(`正在打开 ${getLocaleRepoName(repo)}`)
    await $`code .`
  }
}

function getRepoUrl(repo) {
  return `https://git.duowan.com/webs/shopline-static/layout/themes/${repo.repoName}.git`
}

function getLocaleRepoName(repo) {
  return repo.alias || repo.repoName
}

function getOriginBranchName(repo) {
  return repo.originBranchName || 'master'
}

function log(...args) {
  console.log(chalk.blue(...args))
}

function error(...args) {
  console.log(chalk.red(...args))
}

function success(...args) {
  console.log(chalk.green(...args))
}

function warn(...args) {
  console.log(chalk.yellow(...args))
}

function ques(...args) {
  console.log(chalk.cyan(...args))
}

main()
  .catch(err => {
    error("error: ", err)
  })

async function test() {
  // const answer = await question('test', { choices: ['y', 'n'] })
  // console.log(answer)
  // cd('Flexible')
  // const dirs = await glob(patchDir)
  // console.log(dirs)
  // console.log(path.relative('Flexible', dirs[0]))
  // cd('Edges')
  // const isSuccess = await $`git diff --exit-code && git diff --cached --exit-code`.exitCode === 0
  // console.log('isSuccess: ', isSuccess)
}

// test()