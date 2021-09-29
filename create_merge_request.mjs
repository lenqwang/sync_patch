#!/usr/bin/env zx

async function main() {
  const _title = await nothrow($`git log -1 --pretty=%B`)
  const _assign = await nothrow($`git config --get user.name`)
  const target_branch = argv['target_branch' || 'b'] || 'master'
  const title = argv['title' || 't'] || _title
  const assign = argv['assign' || 'a'] || _assign
  const description = argv['description' || 'd'] || ``

  console.log('target_branch: ', target_branch)
  console.log('title: ', title)
  console.log('assign: ', assign)
  console.log('description: ', description)

  await $`
git push -o merge_request.create \
  -o merge_request.target=${target_branch} \
  -o merge_request.title=${title} \
  -o merge_request.assignee="${assign}" \
  -o merge_request.description=${description}
  `
}

main().catch(e => console.error(e))