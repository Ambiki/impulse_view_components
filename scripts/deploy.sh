#!/usr/bin/env sh

# abort on errors
set -e

# build
yarn docs:build

# navigate into the build output directory
cd docs/.vitepress/dist

git init
git add -A
git commit -m 'feat: deploy docs'

git push -f git@github.com:Ambiki/impulse_view_components.git main:gh-pages

cd -
