var disqus_shortname = document.getElementById('disqus_thread').dataset.shortname;
/* ensure that pages with query string get the same discussion */
var url_parts = window.location.href.split("?");
var disqus_url = url_parts[0];
(function () {
  var dsq = document.createElement('script');
  dsq.type = 'text/javascript';
  dsq.async = true;
  dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
  (document.head || document.body).appendChild(dsq);
})();
