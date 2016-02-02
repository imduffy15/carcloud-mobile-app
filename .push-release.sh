#!/bin/bash

git config --global user.name "Noor"
git config --global user.email "aknoormohamed@gmail.com"
git remote set-url origin https://${GH_TOKEN}@github.com/aknoormohamed/carcloud-mobile-app.git
git fetch --tags

export VERSION=`grep -Po '(?<="version": ")[^"]*' package.json`

if [ -z "${TRAVIS_TAG}" ]; then git tag $VERSION; fi
if [ -z "${TRAVIS_TAG}" ]; then git push --tags; fi

if [ -z "${TRAVIS_TAG}" ]; then cd www; git init; git remote add origin https://${GH_TOKEN}@github.com/aknoormohamed/carcloud-mobile-app.git; git add .; git commit -a -m "init"; git push -u origin -f master:gh-pages; cd ../; fi
