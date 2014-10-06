#!/bin/bash

git config user.name "Travis-CI"
git config user.email "travisci@ianduffy.ie"
git remote set-url origin https://${GH_TOKEN}@github.com/imduffy15/carcloud-mobile-app.git
git fetch --tags

export VERSION=`grep -Po '(?<="version": ")[^"]*' package.json`

if [ -z "${TRAVIS_TAG}" ]; then git tag $VERSION.$TRAVIS_BUILD_NUMBER; fi
if [ -z "${TRAVIS_TAG}" ]; then git push --tags; fi
if [ -z "${TRAVIS_TAG}" ]; then git push -u origin -f master:gh-pages; fi
