require 'date'
require 'json'
require 'yaml'

# Validate front matter của mọi posts/**/index.md theo _tests/post.schema.json.
# Chạy: bundle exec ruby _tests/post_frontmatter_test.rb
# Validator này implement một subset JSON Schema draft-07: type, enum/const,
# required, properties, additionalProperties, pattern, minimum/maximum,
# minLength, minItems/maxItems, items, if/then, allOf.

root = File.expand_path('..', __dir__)
SCHEMA = JSON.parse(File.read(File.join(__dir__, 'post.schema.json')))

def type_ok?(value, type)
  case type
  when 'string' then value.is_a?(String)
  when 'number' then value.is_a?(Numeric)
  when 'integer' then value.is_a?(Integer)
  when 'boolean' then value == true || value == false
  when 'array' then value.is_a?(Array)
  when 'object' then value.is_a?(Hash)
  else true
  end
end

def validate(data, schema, path, errors)
  if schema['type'] && !type_ok?(data, schema['type'])
    errors << "#{path}: expected #{schema['type']}, got #{data.class}"
    return
  end
  errors << "#{path}: not in enum #{schema['enum'].inspect}" if schema['enum'] && !schema['enum'].include?(data)
  errors << "#{path}: expected #{schema['const'].inspect}" if schema.key?('const') && data != schema['const']
  if data.is_a?(String)
    errors << "#{path}: does not match #{schema['pattern']}" if schema['pattern'] && !data.match?(Regexp.new(schema['pattern']))
    errors << "#{path}: shorter than minLength #{schema['minLength']}" if schema['minLength'] && data.length < schema['minLength']
  end
  if data.is_a?(Numeric)
    errors << "#{path}: < minimum #{schema['minimum']}" if schema['minimum'] && data < schema['minimum']
    errors << "#{path}: > maximum #{schema['maximum']}" if schema['maximum'] && data > schema['maximum']
  end
  if data.is_a?(Array)
    errors << "#{path}: fewer than minItems #{schema['minItems']}" if schema['minItems'] && data.size < schema['minItems']
    errors << "#{path}: more than maxItems #{schema['maxItems']}" if schema['maxItems'] && data.size > schema['maxItems']
    data.each_with_index { |item, i| validate(item, schema['items'], "#{path}[#{i}]", errors) } if schema['items']
  end
  if data.is_a?(Hash)
    (schema['required'] || []).each do |key|
      errors << "#{path}: missing required key '#{key}'" unless data.key?(key)
    end
    (schema['properties'] || {}).each do |key, sub|
      validate(data[key], sub, "#{path}.#{key}", errors) if data.key?(key)
    end
    if schema['additionalProperties'] == false
      allowed = (schema['properties'] || {}).keys
      (data.keys - allowed).each { |key| errors << "#{path}: unknown key '#{key}'" }
    end
  end
  if schema['if']
    cond = []
    validate(data, schema['if'], path, cond)
    if cond.empty? && schema['then']
      validate(data, schema['then'], path, errors)
    elsif !cond.empty? && schema['else']
      validate(data, schema['else'], path, errors)
    end
  end
  (schema['allOf'] || []).each { |sub| validate(data, sub, path, errors) }
end

files = Dir.glob(File.join(root, 'posts/**/index.md'))
raise 'No posts found' if files.empty?

problems = []
files.each do |file|
  src = File.read(file)
  unless src =~ /\A---\s*\n(.*?)\n---\s*\n/m
    problems << "#{file}: no front matter block"
    next
  end
  data = begin
    YAML.safe_load(Regexp.last_match(1), permitted_classes: [Date, Time], aliases: true)
  rescue Psych::Exception => e
    problems << "#{file}: YAML error: #{e.message}"
    next
  end
  unless data.is_a?(Hash)
    problems << "#{file}: front matter is not a mapping"
    next
  end

  # YAML parse date không quote thành Time/Date — Jekyll chấp nhận, coerce về
  # chuỗi trước khi validate pattern.
  data = data.transform_values { |v| v.is_a?(Time) || v.is_a?(Date) ? v.to_s : v }

  errors = []
  validate(data, SCHEMA, 'front matter', errors)

  # Bản EN phải khai báo lang: en; bản VI không được khai báo lang.
  if File.basename(file) == 'index.en.md' && data['lang'] != 'en'
    errors << "index.en.md must declare lang: en"
  end

  problems += errors.map { |e| "#{file.sub("#{root}/", '')}: #{e}" }
end

if problems.empty?
  puts "Post front matter tests passed: #{files.size} files valid against post.schema.json"
else
  puts "Front matter problems (#{problems.size}):"
  problems.each { |p| puts "  #{p}" }
  exit 1
end
