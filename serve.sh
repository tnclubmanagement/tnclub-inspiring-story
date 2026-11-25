#!/bin/bash
# Chạy thử trang trên máy. Dùng: ./serve.sh
# Mở http://localhost:4000 sau khi thấy "Server running..."

set -e
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"
export GEM_HOME="$HOME/.gem-beautiful-jekyll"
export PATH="$GEM_HOME/bin:$PATH"

cd "$(dirname "$0")"
export BUNDLE_GEMFILE="$PWD/Gemfile.local"

if ! gem list -i bundler -v ">=0" --silent >/dev/null 2>&1; then
  gem install bundler --no-document
fi

bundle check >/dev/null 2>&1 || bundle install

export JEKYLL_DEBOUNCE_SECONDS="${JEKYLL_DEBOUNCE_SECONDS:-3}"

bundle exec ruby -rjekyll -rjekyll-watch -e '
  delay = Float(ENV.fetch("JEKYLL_DEBOUNCE_SECONDS"))
  abort "JEKYLL_DEBOUNCE_SECONDS phải là số dương hữu hạn" unless delay.finite? && delay.positive?

  Jekyll::Watcher.singleton_class.prepend(Module.new do
    define_method(:build_listener) do |site, options|
      Listen.to(options["source"],
                ignore: listen_ignore_paths(options) + [%r!^\.jekyll-cache(?:/|$)!],
                force_polling: options["force_polling"],
                wait_for_delay: delay,
                &listen_handler(site))
    end
  end)

  load Gem.bin_path("jekyll", "jekyll")
' -- serve --future --config _config.yml,.jekyll-local.yml "$@" &
server_pid=$!

cleanup() {
  trap - INT TERM EXIT
  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
}

stop_server() {
  cleanup
  exit 130
}

trap stop_server INT TERM
trap cleanup EXIT

printf "Nhấn R để ép reload trang qua LiveReload, Ctrl+C để dừng server.\n"

while kill -0 "$server_pid" 2>/dev/null; do
  if IFS= read -r -n 1 -s key; then
    case "$key" in
      r|R)
        touch index.html
        printf "\nĐã yêu cầu reload trang.\n"
        ;;
    esac
  else
    break
  fi
done

wait "$server_pid"
