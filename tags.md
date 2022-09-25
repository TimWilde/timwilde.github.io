---
layout: page
title: Tags
scripts:
   - tag-filter.js
---
{%- assign allTags = site.posts | map:"tags" | uniq | compact | sort_natural %}

{%- if allTags.size > 0 %}

<div class="page-tags">
   <ul class="tags">
      {%- for tag in allTags %}
      <li class="tag"><a href="#{{ tag | slugify }}" data-tag="{{tag | slugify}}">{{tag | downcase}}</a></li>
      {%- endfor %}
   </ul>
</div>

<div class="filter" data-enabled="false">
   <button type="button">Clear Filter</button>
</div>

   {%- for tag in allTags %}
<section data-tag="{{ tag | slugify }}">
<h2 class="tag" id="{{tag | slugify}}" data-tag="{{tag | slugify}}">{{ tag | capitalize }}</h2>
<ul>
      {%- for page in site.posts %}
         {%- if page.tags contains tag %}
            {%- assign tags = "" | split: "," %}
            {%- for pageTag in page.tags %}
               {%- assign tagSlug = pageTag | slugify %}
               {%- assign tags = tags | push: tagSlug %}
            {%- endfor %}
   <li><a href="{{site.baseurl}}{{page.url}}" data-tags="{{ tags | join: "," }}">{{page.title}}</a></li>
         {%- endif %}
      {%- endfor %}
</ul>
</section>
   {%- endfor %}
{%- endif %}
