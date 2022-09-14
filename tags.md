---
layout: page
title: Tags
---
{%- assign allTags = site.posts | map:"tags" | uniq | compact | sort_natural %}

{%- if allTags.size > 0 %}

<div class="page-tags">
   <ul class="tags">
      {%- for tag in allTags %}
      <li class="tag"><a href="#{{ tag | slugify }}">{{tag | downcase}}</a></li>
      {%- endfor %}
   </ul>
</div>

   {%- for tag in allTags %}
<h3 id="{{tag | slugify}}">{{ tag | capitalize }}</h3>
<ul>
      {%- for page in site.posts %}
         {%- if page.tags contains tag %}
   <li><a href="{{site.baseurl}}{{page.url}}">{{page.title}}</a></li>
         {%- endif %}
      {%- endfor %}
</ul>
   {%- endfor %}
{%- endif %}
