require 'base64'
require 'digest'
require 'json'

module Inspiring
  # Xuất dữ liệu thô của các bài có tọa độ ra /map-pins.bin (mỗi ngôn ngữ
  # một file, polyglot tự nhân bản như search-index.json). File được làm
  # nhiễu XOR + base64 để không đọc trực tiếp được — chỉ là obfuscation,
  # không phải mã hóa an toàn (key nằm trong JS). JS ở
  # assets/js/map-pins.js fetch file này và build pin (MapPins.build) —
  # logic phân loại/region/fallback nằm hết ở JS, Ruby chỉ emit field.
  module MapPinsIndex
    XOR_KEY = 'inspiring-map-pins-v1'

    # JSON → XOR từng byte theo key lặp → base64 (JS decode trong map-pins.js)
    def self.encode(text)
      key = XOR_KEY.bytes
      obfuscated = text.bytes.each_with_index.map { |b, i| b ^ key[i % key.size] }.pack('C*')
      Base64.strict_encode64(obfuscated)
    end
    # Front matter → key trong JSON (đúng tên MapPins.build đọc).
    FIELDS = {
      'series' => 'series', 'series_order' => 'seriesOrder',
      'category' => 'category', 'title' => 'title',
      'subtitle' => 'subtitle', 'tags' => 'tags',
      'history-date' => 'historyDate', 'date' => 'date',
      'event_year' => 'eventYear', 'tour_note' => 'tourNote',
      'tour_marker' => 'tourMarker', 'tour_audio' => 'tourAudio',
      'cover-img' => 'cover', 'banner-img' => 'banner',
      'place_name' => 'placeName', 'place_region' => 'placeRegion',
      'place_country' => 'placeCountry', 'place_population' => 'population',
      'place_area' => 'area', 'place_economy' => 'economy',
      'place_festival' => 'festival', 'place_highlights' => 'highlights',
      'place_best_time' => 'bestTime', 'place_food' => 'food',
      'place_transport' => 'transport',
      'map_ranking' => 'ranking', 'map_score' => 'score',
      'map_content_score' => 'contentScore',
      'map_destination_score' => 'destinationScore',
      'map_content_note' => 'contentNote',
      'map_destination_note' => 'destinationNote',
      'map_rating_updated' => 'ratingUpdated'
    }.freeze

    # Avatar nhỏ cho ghim: nếu banner dạng cover.* thì thử avatar.jpg cùng
    # folder — chỉ nhận khi file tồn tại thật trên đĩa (ảnh posts/ không
    # nằm trong site.static_files nên check File.exist?, không check
    # static_files như bản Liquid cũ).
    def self.pin_avatar(site, banner)
      return '' unless banner.to_s.include?('cover.')
      candidate = "#{banner.split('cover.').first}avatar.jpg"
      File.exist?(File.join(site.source, candidate.sub(%r{\A/}, ''))) ? candidate : ''
    end

    def self.build_posts(site)
      site.pages.select { |page| page.data['layout'] == 'post' }.filter_map do |post|
        data = post.data
        athlete = data['athlete']
        geo = athlete.is_a?(Hash) ? athlete['geo'] : nil
        next unless geo || data['geo']
        entry = { 'athlete' => athlete, 'geo' => data['geo'], 'url' => post.url,
                  'pinAvatar' => pin_avatar(site, data['banner-img'].to_s) }
        FIELDS.each { |src, dst| entry[dst] = data[src] unless data[src].nil? }
        entry
      end
    end

    class Generator < Jekyll::Generator
      safe true
      priority :lowest

      def generate(site)
        content = MapPinsIndex.encode(JSON.generate(MapPinsIndex.build_posts(site)))
        page = Jekyll::PageWithoutAFile.new(site, site.source, '', 'map-pins.bin')
        page.data.merge!('layout' => nil, 'sitemap' => false, 'render_with_liquid' => false)
        page.content = content
        site.pages << page
        site.config['map_pins_digest'] = Digest::SHA256.hexdigest(content)[0, 16]
      end
    end
  end
end
