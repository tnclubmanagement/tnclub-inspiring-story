require 'cgi'
require 'digest'
require 'fileutils'
require 'json'
require 'tempfile'

module InspiringStories
  class SearchIndex
    VERSION = 1
    IMPLEMENTATION = Digest::SHA256.file(__FILE__).hexdigest
    FIELDS = %w[title category url date].freeze

    attr_reader :hits, :rebuilt

    def initialize(site)
      @site = site
      @lang = site.config.fetch('active_lang', site.config.fetch('default_lang', 'vi'))
      @default_lang = site.config.fetch('default_lang', 'vi')
      @baseurl = site.config.fetch('baseurl', '').to_s.sub(%r{/$}, '')
      @cache_path = site.in_source_dir('.jekyll-cache', 'inspiring-search', "#{@lang}.json")
      @filters = Object.new.extend(Liquid::StandardFilters)
      @hits = @rebuilt = 0
    end

    def build(documents)
      old_entries = read_cache
      entries = {}
      documents.each do |document|
        data = document.data
        next if data['search'] == false || data['draft'] == true || data['published'] == false
        next if data['lang'] && data['lang'] != @lang
        next unless document.url.end_with?('/', '.html')
        title = data['title'].to_s
        title = @site.config['title'].to_s if title.empty? && document.url == '/'
        next if title.strip.empty? || title == '{title}' || document.url == '/404.html'

        date = data['date']
        date = date.strftime(@site.config.fetch('date_format', '%d/%m/%Y')) if date.respond_to?(:strftime)
        fields = {
          'title' => title,
          'category' => Array(data['tags']).map(&:to_s).join(', '),
          'url' => "#{@baseurl}#{@lang == @default_lang ? '' : "/#{@lang}"}#{document.url}",
          'date' => date.to_s
        }
        fingerprint = Digest::SHA256.hexdigest(JSON.generate([VERSION, IMPLEMENTATION, @lang, fields]))
        key = document.path.to_s
        cached = old_entries[key]
        entry = if cached.is_a?(Hash) && cached['fingerprint'] == fingerprint && valid_entry?(cached['entry'])
                  @hits += 1
                  cached['entry']
                else
                  @rebuilt += 1
                  fields.merge('title' => plain_text(title), 'category' => plain_text(fields['category']))
                end
        entries[key] = { 'fingerprint' => fingerprint, 'entry' => entry }
      end
      write_cache(entries)
      entries.values.map { |value| value['entry'] }.uniq { |entry| entry['url'] }
    end

    private

    def plain_text(text)
      CGI.unescapeHTML(@filters.strip_html(text)).gsub(/\s+/, ' ').strip
    end

    def valid_entry?(entry)
      entry.is_a?(Hash) && FIELDS.all? { |field| entry[field].is_a?(String) }
    end

    def read_cache
      return {} if @site.config['disable_disk_cache']
      cache = JSON.parse(File.read(@cache_path))
      cache['version'] == VERSION && cache['entries'].is_a?(Hash) ? cache['entries'] : {}
    rescue JSON::ParserError, SystemCallError, TypeError, NoMethodError
      {}
    end

    def write_cache(entries)
      return if @site.config['disable_disk_cache']
      directory = File.dirname(@cache_path)
      FileUtils.mkdir_p(directory)
      Tempfile.create(['search-', '.json'], directory) do |file|
        file.write(JSON.generate('version' => VERSION, 'entries' => entries))
        file.close
        File.rename(file.path, @cache_path)
      end
    rescue SystemCallError => error
      Jekyll.logger.warn 'Search cache:', "#{@lang}: #{error.class}; index generated without updating cache"
    end
  end

  class SearchIndexGenerator < Jekyll::Generator
    safe true
    priority :lowest

    def generate(site)
      return unless site.config['post_search']
      documents = (site.pages.select { |page| page.html? } + site.posts.docs).sort_by(&:url)
      index = SearchIndex.new(site)
      content = JSON.generate(index.build(documents))
      page = Jekyll::PageWithoutAFile.new(site, site.source, '', 'search-index.json')
      page.data.merge!('layout' => nil, 'sitemap' => false, 'render_with_liquid' => false)
      page.content = content
      site.pages << page
      site.config['search_index_digest'] = Digest::SHA256.hexdigest(content)[0, 16]
      Jekyll.logger.info 'Search index:', "#{@lang}: #{index.hits} cached, #{index.rebuilt} rebuilt"
    end
  end
end
