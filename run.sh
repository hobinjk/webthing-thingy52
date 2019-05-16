#!/bin/bash
set -e
set -x

run_app() {
  export NVM_DIR="$HOME/.nvm"
  [ ! -s "$NVM_DIR/nvm.sh" ] || \. "$NVM_DIR/nvm.sh"  # This loads nvm

  echo "nvm version"
  nvm --version || echo "Use system's node insead of nvm"
  echo "node version"
  node --version
  echo "npm version"
  npm --version
  echo "Starting script..."
  node server.js
}

run_app
