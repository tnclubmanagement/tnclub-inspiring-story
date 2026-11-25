require 'jekyll'
require 'tmpdir'
require 'ostruct'
require_relative '../_plugins/search_index'

def assert(condition, message)
  raise message unless condition
end

Document = Struct.new(:path, :url, :data)
def build(site, documents)
  index = InspiringStories::SearchIndex.new(site)
  [index, index.build(documents)]
end

Dir.mktmpdir('inspiring-search-test') do |directory|
  site = OpenStruct.new(config: { 'baseurl' => '', 'title' => 'Inspiring Stories' })
  site.define_singleton_method(:in_source_dir) { |*parts| File.join(directory, *parts) }
  documents = [
    Document.new('posts/a.md', '/posts/a/', { 'title' => 'Ảnh <em>đẹp</em> &amp; vui', 'tags' => ['Du lịch'] }),
    Document.new('posts/b.md', '/posts/b/', { 'title' => 'B' }),
    Document.new('draft.md', '/draft/', { 'title' => 'Draft', 'draft' => true }),
    Document.new('private.md', '/private/', { 'title' => 'Private', 'search' => false }),
    Document.new('unpublished.md', '/unpublished/', { 'title' => 'Unpublished', 'published' => false }),
    Document.new('404.html', '/404.html', { 'title' => 'Not found' })
  ]
  cold, result = build(site, documents)
  assert(cold.hits == 0 && cold.rebuilt == 2, 'Cold cache indexes eligible entries only')
  assert(result.first['title'] == 'Ảnh đẹp & vui', 'Plain text titles')
  warm, again = build(site, documents)
  assert(warm.hits == 2 && warm.rebuilt == 0 && result == again, 'Warm cache reuse')
  documents.first.data['content'] = 'Body change'
  unchanged, = build(site, documents)
  assert(unchanged.hits == 2, 'Body changes do not invalidate metadata')
  documents.first.data['title'] = 'Updated {{ literal }}'
  changed, result = build(site, documents)
  assert(changed.hits == 1 && changed.rebuilt == 1, 'Only changed entry rebuilt')
  assert(result.first['title'] == 'Updated {{ literal }}', 'Liquid stays literal')
  _, result = build(site, documents.drop(1))
  assert(result.length == 1, 'Deleted entry removed')
  cache = site.in_source_dir('.jekyll-cache', 'inspiring-search', 'index.json')
  assert(JSON.parse(File.read(cache))['entries'].keys == ['posts/b.md'], 'Cache prunes deleted entry')
  File.write(cache, '{invalid')
  corrupt, = build(site, documents)
  assert(corrupt.rebuilt == 2, 'Corrupt cache recovers')
  site.config['baseurl'] = '/tnclub-inspiring-story'
  production, result = build(site, documents)
  assert(production.rebuilt == 2 && result.first['url'] == '/tnclub-inspiring-story/posts/a/', 'Base URL invalidates cache')
  site.config['disable_disk_cache'] = true
  uncached, = build(site, documents)
  assert(uncached.hits == 0 && uncached.rebuilt == 2, 'Disk cache opt-out')
  _, result = build(site, [Document.new('index.html', '/', { 'title' => '' })])
  assert(result.first['title'] == 'Inspiring Stories', 'Homepage title fallback')
end
puts 'PASS: search metadata cache, changes, deletions, corrupt cache, base URL, opt-outs'
