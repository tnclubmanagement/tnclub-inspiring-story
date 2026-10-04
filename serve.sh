#!/bin/bash
# Chạy thử trang trên máy. Dùng: ./serve.sh
# Mở http://localhost:4000 sau khi thấy "Server running..."

set -e
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"
export GEM_HOME="$HOME/.gem-beautiful-jekyll"
export PATH="$GEM_HOME/bin:$PATH"

cd "$(dirname "$0")"

if ! gem list -i bundler -v ">=0" --silent >/dev/null 2>&1; then
  gem install bundler --no-document
fi

bundle check >/dev/null 2>&1 || bundle install

bundle exec jekyll serve --future --baseurl ""
